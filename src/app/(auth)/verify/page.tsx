import Link from "next/link";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";
import { consumeVerificationToken } from "@/lib/tokens";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const email = token ? await consumeVerificationToken(token) : null;

  if (email) {
    await prisma.user.update({ where: { email }, data: { emailVerified: new Date() } });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {email ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <XCircle className="h-5 w-5 text-danger" />
          )}
          {email ? "Email confermata" : "Link non valido"}
        </CardTitle>
        <CardDescription>
          {email
            ? "Il tuo indirizzo email è stato verificato. Ora puoi accedere al tuo workspace."
            : "Questo link di verifica non è valido oppure è scaduto (dura un'ora). Prova a richiederne uno nuovo dalla pagina di accesso."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Link href="/login">
          <Button className="w-full">Vai al login</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
