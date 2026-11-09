import React from "react";
import { Calendar, CheckCircle2, Users, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { IMeetingStats } from "@/features/meeting";

interface MeetingStatsCardsProps {
  stats?: IMeetingStats;
  isLoading?: boolean;
}

export const MeetingStatsCards: React.FC<MeetingStatsCardsProps> = ({
  stats,
  isLoading,
}) => {
  const cards = [
    {
      title: "Upcoming",
      value: stats?.upcoming ?? 0,
      subtext: "Scheduled & Active",
      icon: Calendar,
      iconColor: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      title: "This Week",
      value: stats?.thisWeek ?? 0,
      subtext: "Planned this week",
      icon: CheckCircle2,
      iconColor: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
    },
    {
      title: "My Meetings",
      value: stats?.myMeetings ?? 0,
      subtext: "Organized or invited",
      icon: Users,
      iconColor: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      title: "Past Meetings",
      value: stats?.past ?? 0,
      subtext: "Completed & archived",
      icon: Clock,
      iconColor: "text-amber-500",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <Card key={idx} className="border shadow-xs hover:shadow-sm transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium">{card.title}</p>
                <div className="text-2xl font-bold mt-1">
                  {isLoading ? (
                    <span className="inline-block w-8 h-6 bg-muted animate-pulse rounded" />
                  ) : (
                    card.value
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{card.subtext}</p>
              </div>
              <div className={`p-2.5 rounded-xl ${card.bgColor} ${card.iconColor}`}>
                <Icon className="w-5 h-5" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default MeetingStatsCards;

