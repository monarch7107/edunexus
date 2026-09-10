import { Card, CardContent, CardHeader } from "@/components/ui/card"

export default function DashboardPage() {
  return (
    <main className="flex flex-col gap-6 p-6">
        <header className="flex flex-col gap-2">
          <p className="text-sm font-medium text-muted-foreground">Academic command center</p>
          <h1 className="text-3xl font-semibold tracking-tight">Good morning, Alex</h1>
          <p className="max-w-2xl text-muted-foreground">
            Your learning plan is on track. Review today&apos;s priorities and let EduNexus help you make the next best move.
          </p>
        </header>
        <section className="grid gap-4 md:grid-cols-3" aria-label="Academic overview">
          <Card>
            <CardHeader title="Study streak" />
            <CardContent><p className="text-3xl font-semibold">12 days</p><p className="text-sm text-muted-foreground">Keep the momentum going</p></CardContent>
          </Card>
          <Card>
            <CardHeader title="Weekly progress" />
            <CardContent><p className="text-3xl font-semibold">78%</p><p className="text-sm text-muted-foreground">Ahead of your target</p></CardContent>
          </Card>
          <Card>
            <CardHeader title="Next milestone" />
            <CardContent><p className="text-3xl font-semibold">Physics quiz</p><p className="text-sm text-muted-foreground">Due Friday</p></CardContent>
          </Card>
        </section>
      </main>
  )
}
