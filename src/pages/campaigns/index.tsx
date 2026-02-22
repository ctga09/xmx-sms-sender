import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import type { Campaign } from "@/types"

const statusColors: Record<string, string> = {
  draft: "bg-gray-500",
  scheduled: "bg-blue-500",
  running: "bg-yellow-500",
  paused: "bg-orange-500",
  completed: "bg-green-500",
  failed: "bg-red-500",
}

const statusLabels: Record<string, string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  running: "Sending",
  paused: "Paused",
  completed: "Completed",
  failed: "Failed",
}

export default function CampaignsPage() {
  const { user } = useAuth()
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    supabase
      .from("campaigns")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setCampaigns(data || [])
        setLoading(false)
      })
  }, [user])

  return (
    <div>
      <Header title="Campaigns" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-medium">Your Campaigns</h2>
          <Link to="/campaigns/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Campaign
            </Button>
          </Link>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Sent</TableHead>
                  <TableHead className="text-right">Delivered</TableHead>
                  <TableHead className="text-right">Failed</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Loading...
                    </TableCell>
                  </TableRow>
                ) : campaigns.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No campaigns created
                    </TableCell>
                  </TableRow>
                ) : (
                  campaigns.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell>
                        <Link to={`/campaigns/${c.id}`} className="text-primary hover:underline font-medium">
                          {c.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[c.status]}>
                          {statusLabels[c.status] || c.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="uppercase">{c.provider}</TableCell>
                      <TableCell className="text-right">{c.total_recipients}</TableCell>
                      <TableCell className="text-right">{c.sent_count}</TableCell>
                      <TableCell className="text-right">{c.delivered_count}</TableCell>
                      <TableCell className="text-right">{c.failed_count}</TableCell>
                      <TableCell>{new Date(c.created_at).toLocaleDateString("en-US")}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
