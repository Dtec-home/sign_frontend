import * as React from "react";
import { Link } from "react-router-dom";
import { FileText, Clock, AlertCircle, CheckCircle2, Upload, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import * as api from "../lib/api";
import type { DashboardStats } from "../types";

export function DashboardPage() {
  const [stats, setStats] = React.useState<DashboardStats | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.getDashboardStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statCards = [
    {
      title: "My Documents",
      value: stats?.documents ?? 0,
      icon: FileText,
      href: "/documents",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Pending",
      value: stats?.pending ?? 0,
      icon: Clock,
      href: "/pending",
      color: "text-yellow-600",
      bgColor: "bg-yellow-100",
    },
    {
      title: "Action Required",
      value: stats?.action_required ?? 0,
      icon: AlertCircle,
      href: "/action-required",
      color: "text-red-600",
      bgColor: "bg-red-100",
      highlight: (stats?.action_required ?? 0) > 0,
    },
    {
      title: "Completed",
      value: stats?.completed ?? 0,
      icon: CheckCircle2,
      href: "/completed",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your signature activity
          </p>
        </div>
        <Link to="/documents">
          <Button>
            <Upload className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Link key={card.title} to={card.href}>
              <Card
                className={cn(
                  "transition-shadow hover:shadow-md cursor-pointer",
                  card.highlight && "ring-2 ring-red-500"
                )}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    {card.title}
                  </CardTitle>
                  <div className={cn("rounded-full p-2", card.bgColor)}>
                    <Icon className={cn("h-4 w-4", card.color)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {loading ? (
                      <div className="h-8 w-16 animate-pulse rounded bg-muted" />
                    ) : (
                      card.value
                    )}
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/documents" className="block">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload New Document
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            {(stats?.action_required ?? 0) > 0 && (
              <Link to="/action-required" className="block">
                <Button variant="outline" className="w-full justify-between text-red-600 border-red-200 hover:bg-red-50">
                  <span className="flex items-center">
                    <AlertCircle className="mr-2 h-4 w-4" />
                    Sign Pending Documents ({stats?.action_required})
                  </span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            )}
            <Link to="/pending" className="block">
              <Button variant="outline" className="w-full justify-between">
                <span className="flex items-center">
                  <Clock className="mr-2 h-4 w-4" />
                  View Pending Requests
                </span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Getting Started</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                1
              </div>
              <p>Upload a PDF document that needs signatures</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                2
              </div>
              <p>Select signers and place signature areas on the document</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                3
              </div>
              <p>Send for signing and track progress</p>
            </div>
            <div className="flex items-start gap-3">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                4
              </div>
              <p>Download the fully signed document</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
