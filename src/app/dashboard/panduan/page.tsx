import fs from "fs";
import path from "path";
import { redirect } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent } from "@/components/ui/card";

export default async function PanduanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .single();

  if (profile?.role !== "admin" && profile?.role !== "editor") {
    redirect("/dashboard");
  }

  const filePath = path.join(process.cwd(), "docs", "PANDUAN-PENGURUS.md");
  const content = fs.readFileSync(filePath, "utf-8");

  return (
    <Card>
      <CardContent>
        <article className="prose prose-neutral dark:prose-invert max-w-none prose-headings:scroll-mt-20">
          <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSlug]}>
            {content}
          </ReactMarkdown>
        </article>
      </CardContent>
    </Card>
  );
}
