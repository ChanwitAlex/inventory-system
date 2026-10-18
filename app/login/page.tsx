import Link from "next/link";
import { redirect } from "next/navigation";
import { auth, githubEnabled } from "@/app/auth";
import LoginForm from "./login-form";
import { githubSignIn } from "./actions";

type Props = {
  searchParams: Promise<{ callbackUrl?: string; registered?: string }>;
};

export default async function LoginPage({ searchParams }: Props) {
  const session = await auth();
  if (session?.user) redirect("/");

  const { callbackUrl, registered } = await searchParams;

  return (
    <div className="mx-auto mt-10 max-w-sm">
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-semibold text-brand">ระบบจัดการสินค้าและคลังสินค้า</h1>
        <p className="mt-1 text-sm text-muted">เข้าสู่ระบบเพื่อจัดการสต็อกสินค้า</p>
      </div>

      <div className="card p-6">
        {registered && (
          <p className="mb-4 rounded-md bg-brand-soft px-3 py-2 text-sm text-brand">
            สมัครสมาชิกเรียบร้อยแล้ว กรุณารอผู้ดูแลระบบอนุมัติก่อนเข้าสู่ระบบ
          </p>
        )}

        <LoginForm callbackUrl={callbackUrl ?? "/"} />

        {githubEnabled && (
          <>
            <div className="my-4 flex items-center gap-3 text-xs text-muted">
              <span className="h-px flex-1 bg-line" />
              หรือ
              <span className="h-px flex-1 bg-line" />
            </div>
            <form action={githubSignIn}>
              <button className="btn-ghost w-full">เข้าสู่ระบบด้วย GitHub</button>
            </form>
          </>
        )}
      </div>

      <p className="mt-4 text-center text-sm text-muted">
        ยังไม่มีบัญชี?{" "}
        <Link href="/signup" className="font-medium text-brand hover:underline">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  );
}