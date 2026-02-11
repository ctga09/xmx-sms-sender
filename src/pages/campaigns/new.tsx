import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { ContactGroup, SmsProvider } from "@/types"

export default function NewCampaignPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState("")
  const [message, setMessage] = useState("")
  const [provider, setProvider] = useState<SmsProvider>("onbuka")
  const [senderId, setSenderId] = useState("")
  const [groups, setGroups] = useState<ContactGroup[]>([])
  const [selectedGroup, setSelectedGroup] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!user) return
    supabase
      .from("contact_groups")
      .select("*")
      .eq("user_id", user.id)
      .then(({ data }) => setGroups(data || []))
  }, [user])

  const handleCreate = async () => {
    if (!name || !message || !selectedGroup) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)

    // Get group contacts
    const { data: members } = await supabase
      .from("contact_group_members")
      .select("contacts(id, phone)")
      .eq("group_id", selectedGroup)

    const contacts = members?.map((m) => m.contacts as { id: string; phone: string }).filter(Boolean) || []

    if (contacts.length === 0) {
      toast.error("The selected group has no contacts")
      setLoading(false)
      return
    }

    // Create campaign
    const { data: campaign, error } = await supabase
      .from("campaigns")
      .insert({
        user_id: user!.id,
        name,
        message,
        provider,
        sender_id: senderId || null,
        total_recipients: contacts.length,
        status: "draft",
      })
      .select()
      .single()

    if (error || !campaign) {
      toast.error("Failed to create campaign", { description: error?.message })
      setLoading(false)
      return
    }

    // Add recipients
    const recipients = contacts.map((c) => ({
      campaign_id: campaign.id,
      contact_id: c.id,
      phone: c.phone,
      status: "pending" as const,
    }))

    await supabase.from("campaign_recipients").insert(recipients)

    setLoading(false)
    toast.success("Campaign created!")
    navigate(`/campaigns/${campaign.id}`)
  }

  return (
    <div>
      <Header title="New Campaign" />
      <div className="p-6 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Create Campaign</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Campaign Name</Label>
              <Input placeholder="Ex: Black Friday Promo" value={name} onChange={(e) => setName(e.target.value)} />
            </div>

            <div className="space-y-2">
              <Label>Contact Group</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id}>
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={provider} onValueChange={(v) => setProvider(v as SmsProvider)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="onbuka">Onbuka</SelectItem>
                  <SelectItem value="eims_1">EIMS Account 1</SelectItem>
                  <SelectItem value="eims_2">EIMS Account 2</SelectItem>
                  <SelectItem value="eims_3">EIMS Account 3</SelectItem>
                  <SelectItem value="smpp">SMPP</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sender ID (optional)</Label>
              <Input placeholder="Ex: AzaSMS" value={senderId} onChange={(e) => setSenderId(e.target.value)} maxLength={11} />
            </div>

            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea placeholder="Campaign message..." value={message} onChange={(e) => setMessage(e.target.value)} rows={5} />
              <p className="text-sm text-muted-foreground">{message.length} characters</p>
            </div>

            <Button onClick={handleCreate} disabled={loading} className="w-full">
              {loading ? "Creating..." : "Create Campaign"}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
