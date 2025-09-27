"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <header className="mb-8">
        <h1 className="text-balance text-3xl font-semibold">Patent</h1>
        <p className="mt-2 text-muted-foreground">
          Use three laptops. Each participant opens their page and uses the same Match ID to link the session.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>User 1</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Upload your codebase and wait for the judge. Progress animates left to right.
            </p>
            <Button asChild>
              <Link href="/user1">Go to User 1</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>User 2</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Upload your codebase and wait for the judge. Progress animates right to left.
            </p>
            <Button asChild>
              <Link href="/user2">Go to User 2</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Judge</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Verify both uploads are present, then run the comparison to see results.
            </p>
            <Button asChild>
              <Link href="/judge">Go to Judge</Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 text-sm">
        <p className="text-muted-foreground">
          Tip: Pick a simple Match ID (e.g. demo-123) and share it with both users and the judge so all three screens
          reference the same session.
        </p>
      </section>
    </main>
  )
}
