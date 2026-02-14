"use client";

import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCertificateByInternship } from "@/lib/certificates";
import type { Certificate } from "@/types/certificate";

interface CertificateSectionProps {
  internshipId: string;
  internshipStatus: string;
}

export function CertificateSection({
  internshipId,
  internshipStatus,
}: CertificateSectionProps) {
  const [certificate, setCertificate] = useState<Certificate | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCertificate = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getCertificateByInternship(internshipId);
      setCertificate(data);
    } catch {
      // Certificate may not exist yet
    } finally {
      setLoading(false);
    }
  }, [internshipId]);

  useEffect(() => {
    fetchCertificate();
  }, [fetchCertificate]);

  const handleGenerate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const res = await fetch("/api/certificates/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ internship_id: internshipId }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (res.status === 409 && json.certificate_id) {
          await fetchCertificate();
          return;
        }
        throw new Error(json.error);
      }
      setCertificate(json.certificate);
    } catch (err: any) {
      setError(err.message ?? "Failed to generate certificate");
    } finally {
      setGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!certificate) return;
    window.open(`/api/certificates/${certificate.id}/pdf`, "_blank");
  };

  const isCompleted = internshipStatus === "completed";

  if (!isCompleted) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Completion Certificate</CardTitle>
        {certificate && (
          <Badge variant="outline" className="text-xs">
            №{certificate.certificate_number}
          </Badge>
        )}
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-3">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : certificate ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Student</p>
                <p className="font-medium">{certificate.student_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Company</p>
                <p className="font-medium">{certificate.company_name}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Duration</p>
                <p className="font-medium">
                  {new Date(certificate.start_date).toLocaleDateString()} –{" "}
                  {new Date(certificate.end_date).toLocaleDateString()}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Attendance</p>
                <p className="font-medium">
                  {certificate.total_days_attended} days ({certificate.attendance_rate}%)
                </p>
              </div>
            </div>

            {certificate.goals_achieved.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Goals Achieved</p>
                <ul className="text-sm space-y-1">
                  {certificate.goals_achieved.map((g: string, i: number) => (
                    <li key={i} className="flex items-center gap-1.5">
                      <span className="text-green-600">✓</span> {g}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <p className="text-xs text-muted-foreground">
                Issued{" "}
                {new Date(certificate.issued_at).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
              <Button size="sm" onClick={handleDownload}>
                Download PDF
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 space-y-3">
            <p className="text-sm text-muted-foreground">
              This internship is completed. Generate the official certificate.
            </p>
            <Button disabled={generating} onClick={handleGenerate}>
              {generating ? "Generating..." : "Generate Certificate"}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
