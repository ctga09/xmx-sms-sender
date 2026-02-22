import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"
import type { ProviderSettings, ApiKey } from "@/types"
import { Plus, Trash2, Key } from "lucide-react"

export default function SettingsPage() {
  const { profile } = useAuth()
  const [settings, setSettings] = useState<Partial<ProviderSettings>>({})
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [newKeyName, setNewKeyName] = useState("")
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.from("provider_settings").select("*").limit(1).single().then(({ data }) => {
      if (data) setSettings(data)
    })
    supabase.from("api_keys").select("*").order("created_at", { ascending: false }).then(({ data }) => {
      setApiKeys(data || [])
    })
  }, [])

  const saveSettings = async () => {
    setLoading(true)
    if (settings.id) {
      const { error } = await supabase.from("provider_settings").update(settings).eq("id", settings.id)
      if (error) toast.error("Failed to save", { description: error.message })
      else toast.success("Settings saved!")
    } else {
      const { data, error } = await supabase.from("provider_settings").insert(settings).select().single()
      if (error) toast.error("Failed to save", { description: error.message })
      else {
        setSettings(data)
        toast.success("Settings saved!")
      }
    }
    setLoading(false)
  }

  const createApiKey = async () => {
    if (!newKeyName) {
      toast.error("Enter a name for the key")
      return
    }
    // Generate a random API key
    const key = `aza_${crypto.randomUUID().replace(/-/g, "")}`
    const encoder = new TextEncoder()
    const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(key))
    const keyHash = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, "0")).join("")

    const { data, error } = await supabase.from("api_keys").insert({
      name: newKeyName,
      key_hash: keyHash,
      key_preview: key.slice(0, 12) + "...",
    }).select().single()

    if (error) {
      toast.error("Failed to create key", { description: error.message })
    } else if (data) {
      setApiKeys([data, ...apiKeys])
      setNewKeyName("")
      // Show the full key once
      await navigator.clipboard.writeText(key)
      toast.success("Key created and copied!", { description: `${key.slice(0, 20)}... (save in a secure place)` })
    }
  }

  const revokeApiKey = async (id: string) => {
    await supabase.from("api_keys").update({ is_active: false }).eq("id", id)
    setApiKeys(apiKeys.map(k => k.id === id ? { ...k, is_active: false } : k))
    toast.success("Key revoked")
  }

  const updateField = (field: string, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }))
  }

  const isAdmin = profile?.role === "admin"

  return (
    <div>
      <Header title="Settings" />
      <div className="p-6">
        <Tabs defaultValue="providers">
          <TabsList>
            <TabsTrigger value="providers">SMS Providers</TabsTrigger>
            <TabsTrigger value="apikeys">API Keys</TabsTrigger>
          </TabsList>

          <TabsContent value="providers" className="space-y-6 mt-6">
            {!isAdmin && (
              <p className="text-sm text-muted-foreground">Only administrators can modify providers.</p>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Default Provider</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={settings.default_provider || "onbuka"}
                  onValueChange={(v) => updateField("default_provider", v)}
                  disabled={!isAdmin}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="onbuka">Onbuka</SelectItem>
                    <SelectItem value="eims_1">EIMS 1</SelectItem>
                    <SelectItem value="eims_2">EIMS 2</SelectItem>
                    <SelectItem value="eims_3">EIMS 3</SelectItem>
                    <SelectItem value="smpp">SMPP</SelectItem>
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Onbuka</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <Input value={settings.onbuka_api_key || ""} onChange={(e) => updateField("onbuka_api_key", e.target.value)} disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label>API Secret</Label>
                  <Input type="password" value={settings.onbuka_api_secret || ""} onChange={(e) => updateField("onbuka_api_secret", e.target.value)} disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label>App ID</Label>
                  <Input value={settings.onbuka_app_id || ""} onChange={(e) => updateField("onbuka_app_id", e.target.value)} disabled={!isAdmin} />
                </div>
              </CardContent>
            </Card>

            {[1, 2, 3].map((n) => (
              <Card key={n}>
                <CardHeader>
                  <CardTitle>EIMS Account {n}</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label>Account</Label>
                    <Input value={(settings as Record<string, string>)?.[`eims_account_${n}`] || ""} onChange={(e) => updateField(`eims_account_${n}`, e.target.value)} disabled={!isAdmin} />
                  </div>
                  <div className="space-y-2">
                    <Label>Password</Label>
                    <Input type="password" value={(settings as Record<string, string>)?.[`eims_password_${n}`] || ""} onChange={(e) => updateField(`eims_password_${n}`, e.target.value)} disabled={!isAdmin} />
                  </div>
                  <div className="space-y-2">
                    <Label>Servers (comma-separated)</Label>
                    <Input value={(settings as Record<string, string>)?.[`eims_servers_${n}`] || ""} onChange={(e) => updateField(`eims_servers_${n}`, e.target.value)} disabled={!isAdmin} />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card>
              <CardHeader>
                <CardTitle>SMPP</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <Label>Host</Label>
                  <Input value={settings.smpp_host || ""} onChange={(e) => updateField("smpp_host", e.target.value)} disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label>Port</Label>
                  <Input type="number" value={settings.smpp_port || ""} onChange={(e) => updateField("smpp_port", e.target.value)} disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label>System ID</Label>
                  <Input value={settings.smpp_system_id || ""} onChange={(e) => updateField("smpp_system_id", e.target.value)} disabled={!isAdmin} />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input type="password" value={settings.smpp_password || ""} onChange={(e) => updateField("smpp_password", e.target.value)} disabled={!isAdmin} />
                </div>
              </CardContent>
            </Card>

            {isAdmin && (
              <Button onClick={saveSettings} disabled={loading}>
                {loading ? "Saving..." : "Save Settings"}
              </Button>
            )}
          </TabsContent>

          <TabsContent value="apikeys" className="space-y-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Create New Key</CardTitle>
              </CardHeader>
              <CardContent className="flex gap-3">
                <Input
                  placeholder="Key name (e.g.: CRM Integration)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="max-w-sm"
                />
                <Button onClick={createApiKey}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Your Keys</CardTitle>
              </CardHeader>
              <CardContent>
                {apiKeys.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Key className="h-8 w-8 mx-auto mb-2" />
                    <p>No API keys created</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {apiKeys.map((key) => (
                      <div key={key.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div>
                          <p className="font-medium">{key.name}</p>
                          <p className="text-sm text-muted-foreground font-mono">{key.key_preview}</p>
                          <p className="text-xs text-muted-foreground">
                            Created: {new Date(key.created_at).toLocaleDateString("en-US")}
                            {key.last_used_at && ` | Last used: ${new Date(key.last_used_at).toLocaleDateString("en-US")}`}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {key.is_active ? (
                            <Button variant="outline" size="sm" onClick={() => revokeApiKey(key.id)}>
                              <Trash2 className="mr-1 h-3 w-3" /> Revoke
                            </Button>
                          ) : (
                            <span className="text-sm text-red-500">Revoked</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
