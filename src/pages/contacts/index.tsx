import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { supabase } from "@/lib/supabase"
import { useAuth } from "@/contexts/auth-context"
import { Header } from "@/components/layout/header"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Plus, Upload, Search, Trash2 } from "lucide-react"
import { toast } from "sonner"
import type { Contact } from "@/types"

export default function ContactsPage() {
  const { user } = useAuth()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newPhone, setNewPhone] = useState("")
  const [newEmail, setNewEmail] = useState("")

  const fetchContacts = async () => {
    if (!user) return
    let query = supabase
      .from("contacts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500)

    if (search) {
      query = query.or(`name.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const { data } = await query
    setContacts(data || [])
    setLoading(false)
  }

  useEffect(() => {
    fetchContacts()
  }, [user, search])

  const handleAdd = async () => {
    if (!newName || !newPhone) {
      toast.error("Name and phone are required")
      return
    }

    const { error } = await supabase.from("contacts").insert({
      user_id: user!.id,
      name: newName,
      phone: newPhone,
      email: newEmail || null,
    })

    if (error) {
      toast.error("Failed to add contact", { description: error.message })
    } else {
      toast.success("Contact added!")
      setNewName("")
      setNewPhone("")
      setNewEmail("")
      setDialogOpen(false)
      fetchContacts()
    }
  }

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("contacts").delete().eq("id", id)
    if (error) {
      toast.error("Failed to delete")
    } else {
      setContacts(contacts.filter((c) => c.id !== id))
      toast.success("Contact deleted")
    }
  }

  return (
    <div>
      <Header title="Contacts" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-6 gap-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              className="pl-10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Link to="/contacts/import">
              <Button variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Import CSV
              </Button>
            </Link>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Contact</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Name</Label>
                    <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Full name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Phone</Label>
                    <Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="5511999999999" />
                  </div>
                  <div className="space-y-2">
                    <Label>Email (optional)</Label>
                    <Input value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="email@example.com" />
                  </div>
                  <Button onClick={handleAdd} className="w-full">Add</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                  </TableRow>
                ) : contacts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">No contacts</TableCell>
                  </TableRow>
                ) : (
                  contacts.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="font-mono">{c.phone}</TableCell>
                      <TableCell>{c.email || "-"}</TableCell>
                      <TableCell>{c.tags?.join(", ") || "-"}</TableCell>
                      <TableCell>{new Date(c.created_at).toLocaleDateString("en-US")}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </TableCell>
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
