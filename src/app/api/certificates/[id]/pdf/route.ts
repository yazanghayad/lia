import { NextRequest, NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { createClient } from "@supabase/supabase-js";
import { CertificatePDF } from "@/lib/certificate-pdf";
import React from "react";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data: certificate, error } = await supabaseAdmin
      .from("certificates")
      .select("*")
      .eq("id", params.id)
      .single();

    if (error || !certificate) {
      return NextResponse.json({ error: "Certificate not found" }, { status: 404 });
    }

    const buffer = await renderToBuffer(
      React.createElement(CertificatePDF, { certificate })
    );

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="certificate-${certificate.certificate_number}.pdf"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err.message ?? "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
