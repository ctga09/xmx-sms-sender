import { Link } from "react-router-dom"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Zap, Send, Megaphone, BarChart3, Users, Shield, Globe } from "lucide-react"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Zap className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">AzaSMS</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login">
              <Button variant="ghost">Login</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-6 py-24 text-center">
        <h1 className="text-5xl font-bold tracking-tight mb-6">
          Intelligent Platform for<br />
          <span className="text-primary">SMS Marketing</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
          Send bulk SMS, manage campaigns, track deliveries in real time,
          and automate your communication flows with your customers.
        </p>
        <div className="flex gap-4 justify-center">
          <Link to="/login">
            <Button size="lg" className="text-lg px-8">
              Get Started
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Powerful Features</h2>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[
            {
              icon: Send,
              title: "SMS Sending",
              description: "Send individual or bulk SMS to thousands of numbers with multiple provider support.",
            },
            {
              icon: Megaphone,
              title: "Campaigns",
              description: "Create and manage marketing campaigns with real-time delivery tracking.",
            },
            {
              icon: BarChart3,
              title: "Analytics",
              description: "Complete dashboard with interactive charts, delivery rates, and detailed metrics.",
            },
            {
              icon: Users,
              title: "Contact Management",
              description: "Import contacts via CSV, organize into groups, and manage your customer base.",
            },
            {
              icon: Shield,
              title: "Public API",
              description: "Integrate SMS sending into your system with our RESTful API and access keys.",
            },
            {
              icon: Globe,
              title: "Multi-Provider",
              description: "Supports Onbuka, EIMS, and SMPP. Switch between providers without changing your code.",
            },
          ].map((feature) => (
            <Card key={feature.title}>
              <CardHeader>
                <feature.icon className="h-8 w-8 text-primary mb-2" />
                <CardTitle>{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-6 py-16 text-center">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="py-12">
            <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
            <p className="text-muted-foreground mb-6">
              Create your account for free and start sending SMS right now.
            </p>
            <Link to="/login">
              <Button size="lg">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t">
        <div className="container mx-auto px-6 py-8 text-center text-sm text-muted-foreground">
          <p>AzaSMS - SMS Marketing Platform</p>
        </div>
      </footer>
    </div>
  )
}
