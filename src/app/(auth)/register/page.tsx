import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { RegisterForm } from "./register-form";

export default function RegisterPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Crea il workspace del tuo team</CardTitle>
        <CardDescription>
          Il primo account registrato con la tua email aziendale diventa amministratore del team.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RegisterForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Hai già un account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Accedi
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
