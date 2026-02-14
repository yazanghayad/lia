import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { Certificate } from "@/types/certificate";

const styles = StyleSheet.create({
  page: {
    padding: 60,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
  },
  border: {
    border: "3pt solid #1a365d",
    padding: 40,
    height: "100%",
  },
  header: {
    textAlign: "center",
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontFamily: "Helvetica-Bold",
    color: "#1a365d",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "#4a5568",
    marginBottom: 4,
  },
  divider: {
    borderBottom: "1pt solid #cbd5e0",
    marginVertical: 20,
  },
  body: {
    textAlign: "center",
    marginBottom: 20,
  },
  label: {
    fontSize: 11,
    color: "#718096",
    marginBottom: 4,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  value: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: "#2d3748",
    marginBottom: 16,
  },
  studentName: {
    fontSize: 24,
    fontFamily: "Helvetica-Bold",
    color: "#1a365d",
    marginBottom: 20,
  },
  section: {
    marginBottom: 16,
  },
  goalsTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    color: "#4a5568",
    marginBottom: 6,
    textAlign: "left",
  },
  goalItem: {
    fontSize: 11,
    color: "#4a5568",
    marginBottom: 3,
    paddingLeft: 10,
    textAlign: "left",
  },
  stats: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 40,
    marginVertical: 16,
  },
  stat: {
    textAlign: "center",
  },
  statValue: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    color: "#1a365d",
  },
  statLabel: {
    fontSize: 9,
    color: "#718096",
    textTransform: "uppercase" as const,
  },
  footer: {
    position: "absolute",
    bottom: 80,
    left: 100,
    right: 100,
    textAlign: "center",
  },
  footerText: {
    fontSize: 8,
    color: "#a0aec0",
    marginBottom: 2,
  },
  issuedDate: {
    fontSize: 10,
    color: "#718096",
    marginTop: 20,
    textAlign: "center",
  },
});

interface CertificatePDFProps {
  certificate: Certificate;
}

export function CertificatePDF({ certificate }: CertificatePDFProps) {
  const duration = Math.ceil(
    (new Date(certificate.end_date).getTime() -
      new Date(certificate.start_date).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.border}>
          {/* Header */}
          <View style={styles.header}>
            {certificate.school_name && (
              <Text style={styles.subtitle}>{certificate.school_name}</Text>
            )}
            <Text style={styles.title}>Certificate of Completion</Text>
            <Text style={styles.subtitle}>Internship Program</Text>
          </View>

          <View style={styles.divider} />

          {/* Body */}
          <View style={styles.body}>
            <Text style={styles.label}>This certifies that</Text>
            <Text style={styles.studentName}>{certificate.student_name}</Text>

            <Text style={styles.label}>
              has successfully completed an internship at
            </Text>
            <Text style={styles.value}>{certificate.company_name}</Text>

            <Text style={styles.label}>Position</Text>
            <Text style={styles.value}>{certificate.internship_title}</Text>
          </View>

          {/* Stats */}
          <View style={styles.stats}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>{duration}</Text>
              <Text style={styles.statLabel}>Days Duration</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {certificate.total_days_attended}
              </Text>
              <Text style={styles.statLabel}>Days Attended</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {certificate.attendance_rate}%
              </Text>
              <Text style={styles.statLabel}>Attendance Rate</Text>
            </View>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {certificate.goals_achieved.length}
              </Text>
              <Text style={styles.statLabel}>Goals Achieved</Text>
            </View>
          </View>

          {/* Goals */}
          {certificate.goals_achieved.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.goalsTitle}>Goals Achieved:</Text>
              {certificate.goals_achieved.map((goal, i) => (
                <Text key={i} style={styles.goalItem}>
                  • {goal}
                </Text>
              ))}
            </View>
          )}

          {/* Issue date */}
          <Text style={styles.issuedDate}>
            Issued on{" "}
            {new Date(certificate.issued_at).toLocaleDateString(undefined, {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </Text>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              Certificate №: {certificate.certificate_number}
            </Text>
            <Text style={styles.footerText}>
              Verification: {certificate.verification_hash.substring(0, 16)}...
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
