"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAttendance } from "@/hooks/use-attendance";
import { AttendanceCalendar } from "./attendance-calendar";
import { DailyAttendanceForm } from "./daily-attendance-form";
import { AttendanceSummaryView } from "./attendance-summary";
import { SupervisorApprovalList } from "./supervisor-approval-list";
import type { AttendanceRecord, AttendanceStatus } from "@/types/attendance";

interface AttendanceSectionProps {
  internshipId: string;
  studentId: string;
  currentUserId: string;
  userRole: "student" | "supervisor" | "school" | "company" | "admin";
}

export function AttendanceSection({
  internshipId,
  studentId,
  currentUserId,
  userRole,
}: AttendanceSectionProps) {
  const {
    records,
    loading,
    error,
    summary,
    month,
    year,
    navigateMonth,
    getRecordForDate,
    mark,
    approve,
    bulkApprove,
    correct,
  } = useAttendance(internshipId);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<AttendanceRecord | undefined>();

  const isStudent = userRole === "student";
  const isSupervisor = userRole === "supervisor";
  const pendingCount = records.filter((r) => !r.approved).length;

  const handleDayClick = (date: string, record?: AttendanceRecord) => {
    setSelectedDate(date);
    setSelectedRecord(record);
  };

  const handleClose = () => {
    setSelectedDate(null);
    setSelectedRecord(undefined);
  };

  const handleCorrect = async (
    attendanceId: string,
    previousStatus: string,
    newStatus: AttendanceStatus,
    previousNote: string | null,
    newNote: string | undefined,
    reason: string
  ) => {
    await correct(
      {
        attendance_id: attendanceId,
        corrected_by: currentUserId,
        previous_status: previousStatus,
        new_status: newStatus,
        previous_note: previousNote ?? undefined,
        new_note: newNote,
        reason,
      },
      {
        status: newStatus,
        note: newNote,
      }
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Attendance</CardTitle>
      </CardHeader>
      <CardContent>
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading attendance...</p>
        ) : (
          <Tabs defaultValue="calendar">
            <TabsList>
              <TabsTrigger value="calendar">Calendar</TabsTrigger>
              {isSupervisor && (
                <TabsTrigger value="approve">
                  Pending ({pendingCount})
                </TabsTrigger>
              )}
              <TabsTrigger value="summary">Summary</TabsTrigger>
            </TabsList>

            <TabsContent value="calendar" className="mt-4">
              <div className="grid gap-4 md:grid-cols-[1fr_300px]">
                <AttendanceCalendar
                  month={month}
                  year={year}
                  records={records}
                  onNavigate={navigateMonth}
                  onDayClick={handleDayClick}
                  selectedDate={selectedDate}
                />
                {selectedDate ? (
                  <div className="p-4 border rounded-lg">
                    <DailyAttendanceForm
                      date={selectedDate}
                      existingRecord={selectedRecord}
                      internshipId={internshipId}
                      studentId={studentId}
                      isStudent={isStudent}
                      isSupervisor={isSupervisor}
                      currentUserId={currentUserId}
                      onMark={mark}
                      onApprove={approve}
                      onCorrect={handleCorrect}
                      onClose={handleClose}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center p-4 border rounded-lg text-sm text-muted-foreground">
                    {isStudent
                      ? "Select a day to mark attendance"
                      : "Select a day to view details"}
                  </div>
                )}
              </div>
            </TabsContent>

            {isSupervisor && (
              <TabsContent value="approve" className="mt-4">
                <SupervisorApprovalList
                  records={records}
                  onApprove={approve}
                  onBulkApprove={bulkApprove}
                  currentUserId={currentUserId}
                  onSelectRecord={handleDayClick}
                />
              </TabsContent>
            )}

            <TabsContent value="summary" className="mt-4">
              <AttendanceSummaryView summary={summary} />
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}
