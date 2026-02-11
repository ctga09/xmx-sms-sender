import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Play, Pause, Send, CheckCircle, XCircle } from "lucide-react"
import { toast } from "sonner"
import type { Campaign, CampaignRecipient } from "@/types"

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [recipients, setRecipients] = useState<CampaignRecipient[]>([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    if (!id) return
    const [campRes, recipRes] = await Promise.all([
      supabase.from("campaigns").select("*").eq("id", id).single(),
      supabase.from("campaign_recipients").select("*").eq("campaign_id", id).order("sent_at", { ascending: false }).limit(200),
    ])
    setCampaign(campRes.data)
    setRecipients(recipRes.data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()

    // Realtime subscription
    const channel = supabase
      .channel(`campaign-${id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "campaigns", filter: `id=eq.${id}` }, (payload) => {
        setCampaign(payload.new as Campaign)
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "campaign_recipients", filter: `campaign_id=eq.${id}` }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id])

  const startCampaign = async () => {
    if (!campaign) return
    await supabase.from("campaigns").update({ status: "running", started_at: new Date().toISOString() }).eq("id", campaign.id)

    const { error } = await supabase.functions.invoke("campaign-worker", {
      body: { campaign_id: campaign.id },
    })

    if (error) {
      toast.error("Failed to start campaign", { description: error.message })
    } else {
      toast.success("Campaign started!")
    }
  }

  const pauseCampaign = async () => {
    if (!campaign) return
    await supabase.from("campaigns").update({ status: "paused" }).eq("id", campaign.id)
    toast.info("Campaign paused")
  }

  if (loading || !campaign) {
    return (
      <div>
        <Header title="Campaign" />
        <div className="p-6 text-center text-muted-foreground">Loading...</div>
      </div>
    )
  }

  const progress = campaign.total_recipients > 0
    ? Math.round(((campaign.sent_count + campaign.failed_count) / campaign.total_recipients) * 100)
    : 0

  return (
    <div>
      <Header title={campaign.name} />
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Badge variant="secondary">{campaign.status}</Badge>
          <span className="text-sm text-muted-foreground">Provider: {campaign.provider}</span>
          {campaign.status === "draft" && (
            <Button size="sm" onClick={startCampaign}>
              <Play className="mr-1 h-4 w-4" /> Start
            </Button>
          )}
          {campaign.status === "running" && (
            <Button size="sm" variant="outline" onClick={pauseCampaign}>
              <Pause className="mr-1 h-4 w-4" /> Pause
            </Button>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Total</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaign.total_recipients}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1"><Send className="h-3 w-3" /> Sent</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-500">{campaign.sent_count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Delivered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-500">{campaign.delivered_count}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-1"><XCircle className="h-3 w-3" /> Failed</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">{campaign.failed_count}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Message</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm whitespace-pre-wrap">{campaign.message}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recipients</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Message ID</TableHead>
                  <TableHead>Sent at</TableHead>
                  <TableHead>Error</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recipients.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono">{r.phone}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{r.status}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{r.message_id || "-"}</TableCell>
                    <TableCell>{r.sent_at ? new Date(r.sent_at).toLocaleString("en-US") : "-"}</TableCell>
                    <TableCell className="text-red-500 text-xs">{r.error_message || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
