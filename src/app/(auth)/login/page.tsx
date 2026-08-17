import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Accedi</CardTitle>
        <CardDescription>Entra con la tua email aziendale per vedere le task del team.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Non hai ancora un account?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Registra la tua azienda
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
