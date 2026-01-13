"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import {
  updateAssignmentConfig,
  bulkUpdateWIPLimits,
  updateTeamWIPLimit,
} from "@/actions/assignment";
import {
  Settings,
  Users,
  User,
  Save,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Zap,
  BarChart3,
  TrendingUp,
  Sparkles,
  ShieldCheck,
  BellRing,
  Bot,
  Brain,
  Gauge,
} from "lucide-react";
import {
  AdvancedAssignmentSettings,
  defaultAdvancedAssignmentSettings,
} from "@/lib/config/assignment-defaults";

interface AssignmentConfig {
  weightWorkload: number;
  weightSkill: number;
  weightSLA: number;
  weightRandom: number;
  enableAutoAssign: boolean;
  advancedSettings: AdvancedAssignmentSettings;
}

const cloneAdvancedSettings = (
  settings: AdvancedAssignmentSettings
): AdvancedAssignmentSettings => JSON.parse(JSON.stringify(settings));

const matchingModeDescriptions: Record<AdvancedAssignmentSettings["matching"]["mode"], string> = {
  strict: "Chỉ giao khi skill khớp 100%, phù hợp cho task đặc thù hoặc khách hàng khó tính.",
  balanced: "Cân bằng giữa skill chính và kỹ năng gần nhất, phù hợp cho hầu hết team vận hành.",
  flexible: "Cho phép mở rộng sang kỹ năng lân cận để tránh backlog bị nghẽn.",
};

const fallbackStrategyDescriptions: Record<
  AdvancedAssignmentSettings["matching"]["fallbackStrategy"],
  string
> = {
  smart_balance: "Tự động đánh giá lại toàn đội và ưu tiên người ít tải nhất nhưng vẫn hợp fit.",
  round_robin: "Luân phiên giao task giữa các thành viên để đảm bảo công bằng.",
  manual_gate: "Đưa task vào danh sách chờ để leader duyệt thủ công.",
  random_spread: "Phân bổ ngẫu nhiên trong nhóm đáp ứng tối thiểu, dùng khi cần tốc độ.",
};

const previewScenarios = {
  balanced: {
    label: "Tải trọng cân bằng",
    description: "Team hoạt động ổn định, workload vừa phải.",
    users: [
      {
        id: "u1",
        name: "Linh - Senior",
        workloadFactor: 0.75,
        skillFactor: 0.92,
        slaFactor: 0.97,
        randomFactor: 0.4,
        seniority: 0.8,
        crossSkill: 0.4,
        burnout: 0.1,
        backlogAge: 0.2,
      },
      {
        id: "u2",
        name: "Thắng - Mid",
        workloadFactor: 0.55,
        skillFactor: 0.72,
        slaFactor: 0.88,
        randomFactor: 0.6,
        seniority: 0.5,
        crossSkill: 0.6,
        burnout: 0.2,
        backlogAge: 0.3,
      },
      {
        id: "u3",
        name: "Vy - Cross-skill",
        workloadFactor: 0.65,
        skillFactor: 0.85,
        slaFactor: 0.9,
        randomFactor: 0.55,
        seniority: 0.4,
        crossSkill: 0.8,
        burnout: 0.15,
        backlogAge: 0.4,
      },
    ],
  },
  urgent: {
    label: "Nhiều ticket SLA gấp",
    description: "Backlog nhiều yêu cầu sắp quá SLA, cần ưu tiên tốc độ.",
    users: [
      {
        id: "u4",
        name: "Minh - Chuyên gia SLA",
        workloadFactor: 0.6,
        skillFactor: 0.88,
        slaFactor: 0.99,
        randomFactor: 0.35,
        seniority: 0.7,
        crossSkill: 0.3,
        burnout: 0.25,
        backlogAge: 0.6,
      },
      {
        id: "u5",
        name: "Trang - Đa nhiệm",
        workloadFactor: 0.8,
        skillFactor: 0.78,
        slaFactor: 0.9,
        randomFactor: 0.45,
        seniority: 0.6,
        crossSkill: 0.7,
        burnout: 0.3,
        backlogAge: 0.7,
      },
      {
        id: "u6",
        name: "Đạt - Đang rảnh",
        workloadFactor: 0.4,
        skillFactor: 0.68,
        slaFactor: 0.8,
        randomFactor: 0.65,
        seniority: 0.3,
        crossSkill: 0.5,
        burnout: 0.1,
        backlogAge: 0.5,
      },
    ],
  },
  overloaded: {
    label: "Team quá tải",
    description: "Phần lớn thành viên đạt WIP, cần cân nhắc guardrail.",
    users: [
      {
        id: "u7",
        name: "Huyền - Leader",
        workloadFactor: 0.85,
        skillFactor: 0.9,
        slaFactor: 0.94,
        randomFactor: 0.3,
        seniority: 0.9,
        crossSkill: 0.4,
        burnout: 0.35,
        backlogAge: 0.5,
      },
      {
        id: "u8",
        name: "Quân - Senior",
        workloadFactor: 0.92,
        skillFactor: 0.86,
        slaFactor: 0.89,
        randomFactor: 0.4,
        seniority: 0.7,
        crossSkill: 0.6,
        burnout: 0.45,
        backlogAge: 0.55,
      },
      {
        id: "u9",
        name: "My - Rookie",
        workloadFactor: 0.7,
        skillFactor: 0.6,
        slaFactor: 0.82,
        randomFactor: 0.7,
        seniority: 0.2,
        crossSkill: 0.5,
        burnout: 0.2,
        backlogAge: 0.65,
      },
    ],
  },
} as const;

type PreviewScenarioKey = keyof typeof previewScenarios;

interface TeamData {
  id: string;
  name: string;
  totalMembers: number;
  wipLimit: number;
  totalActiveTasks: number;
  avgUtilization: number;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: string;
  teamId: string | null;
  teamName: string;
  wipLimit: number;
  currentActiveTasks: number;
  utilization: number;
}

interface AutoAssignStats {
  lastAutoAssignTime: string;
  successRate: number;
  totalAutoAssignments: number;
  lastWeekCount: number;
}

interface AssignmentConfigClientProps {
  initialConfig: AssignmentConfig;
  teams: TeamData[];
  users: UserData[];
  autoAssignStats: AutoAssignStats;
}

/**
 * Assignment Configuration Client Component
 * 
 * Interactive admin panel for configuring assignment weights and WIP limits.
 * 
 * References: mindmap CONF_W, CONF_WIP, LB, WIP
 */
export function AssignmentConfigClient({
  initialConfig,
  teams,
  users,
  autoAssignStats,
}: AssignmentConfigClientProps) {
  const router = useRouter();
  const toast = useToast();

  // State for assignment weights
  const [config, setConfig] = useState<AssignmentConfig>(() => ({
    ...initialConfig,
    advancedSettings: initialConfig.advancedSettings
      ? cloneAdvancedSettings(initialConfig.advancedSettings)
      : cloneAdvancedSettings(defaultAdvancedAssignmentSettings),
  }));
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Scenario preview state
  const [previewScenario, setPreviewScenario] = useState<PreviewScenarioKey>("balanced");

  const updateAdvancedSection = <Section extends keyof AdvancedAssignmentSettings>(
    section: Section,
    value: Partial<AdvancedAssignmentSettings[Section]>
  ) => {
    setConfig((prev) => ({
      ...prev,
      advancedSettings: {
        ...prev.advancedSettings,
        [section]: {
          ...prev.advancedSettings[section],
          ...value,
        },
      },
    }));
  };

  const { advancedSettings } = config;

  const handleGuardrailNumberChange = <
    K extends keyof AdvancedAssignmentSettings["guardrails"]
  >(
    key: K,
    value: number
  ) => {
    let sanitized = Number(value);
    if (!Number.isFinite(sanitized)) {
      sanitized = 0;
    }

    if (key === "backlogAgingBoost") {
      sanitized = Number(Math.min(0.5, Math.max(0, sanitized)).toFixed(2));
    } else if (key === "slaGracePercent") {
      sanitized = Math.min(100, Math.max(0, Math.floor(sanitized)));
    } else {
      sanitized = Math.max(0, Math.floor(sanitized));
    }

    updateAdvancedSection("guardrails", {
      [key]: sanitized,
    } as Partial<AdvancedAssignmentSettings["guardrails"]>);
  };

  const handleAutomationChange = <
    K extends keyof AdvancedAssignmentSettings["automation"]
  >(
    key: K,
    value: AdvancedAssignmentSettings["automation"][K]
  ) => {
    let sanitizedValue: AdvancedAssignmentSettings["automation"][K] = value;

    if (typeof sanitizedValue === "number") {
      if (key === "escalateAfterHours") {
        sanitizedValue = Math.max(1, Math.floor(sanitizedValue)) as AdvancedAssignmentSettings["automation"][K];
      } else if (key === "autoAssignBacklogOlderThanHours") {
        sanitizedValue = Math.max(0, Math.floor(sanitizedValue)) as AdvancedAssignmentSettings["automation"][K];
      }
    }

    updateAdvancedSection("automation", {
      [key]: sanitizedValue,
    } as Partial<AdvancedAssignmentSettings["automation"]>);
  };

  const handleNotificationToggle = <
    K extends keyof AdvancedAssignmentSettings["notifications"]
  >(
    key: K,
    value: boolean
  ) => {
    updateAdvancedSection("notifications", { [key]: value });
  };

  const weightSum =
    config.weightWorkload + config.weightSkill + config.weightSLA + config.weightRandom;

  const weightDistribution = [
    { label: "Workload", value: config.weightWorkload },
    { label: "Skill", value: config.weightSkill },
    { label: "SLA", value: config.weightSLA },
    { label: "Random", value: config.weightRandom },
  ];

  const guardrailSummary = [
    advancedSettings.guardrails.maxAssignmentsPerUserPerDay
      ? `≤ ${advancedSettings.guardrails.maxAssignmentsPerUserPerDay} task/ngày`
      : "Không giới hạn theo ngày",
    advancedSettings.guardrails.cooldownMinutes
      ? `Cooldown ${advancedSettings.guardrails.cooldownMinutes} phút`
      : "Không cooldown",
    `SLA grace ${advancedSettings.guardrails.slaGracePercent}%`,
  ].join(" · ");

  const matchingSummary = [
    advancedSettings.matching.mode === "strict"
      ? "Strict"
      : advancedSettings.matching.mode === "balanced"
      ? "Balanced"
      : "Flexible",
    advancedSettings.matching.prioritizeExactMatch ? "Ưu tiên exact" : "Không ưu tiên exact",
    advancedSettings.matching.allowPartialMatch ? "Cho phép partial" : "Khoá partial",
  ].join(" · ");

  const automationSummary = advancedSettings.automation.autoEscalateStalled
    ? `Auto escalate sau ${advancedSettings.automation.escalateAfterHours}h · Backlog ${advancedSettings.automation.autoAssignBacklogOlderThanHours}h`
    : "Escalate thủ công · Theo dõi backlog bằng tay";

  const selectedScenario = previewScenarios[previewScenario];

  const computePreviewScore = (sample: (typeof selectedScenario)["users"][number]) => {
    const baseScore =
      config.weightWorkload * sample.workloadFactor +
      config.weightSkill * sample.skillFactor +
      config.weightSLA * sample.slaFactor +
      config.weightRandom * sample.randomFactor;

    const modifierScore =
      advancedSettings.scoreModifiers.seniorityBoost * sample.seniority +
      advancedSettings.scoreModifiers.crossSkillBoost * sample.crossSkill -
      advancedSettings.scoreModifiers.burnoutPenalty * sample.burnout +
      advancedSettings.guardrails.backlogAgingBoost * sample.backlogAge;

    const capped = Math.max(0, Math.min(1.25, baseScore + modifierScore));

    return Number(capped.toFixed(3));
  };

  const previewScores = selectedScenario.users.map((user) => ({
    ...user,
    score: computePreviewScore(user),
  }));

  const highestPreviewScore = Math.max(...previewScores.map((item) => item.score));

  // State for team editing
  const [editingTeamId, setEditingTeamId] = useState<string | null>(null);
  const [teamLimitInput, setTeamLimitInput] = useState<string>("");

  // State for user filtering and bulk edit
  const [selectedTeamFilter, setSelectedTeamFilter] = useState<string>("all");
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [bulkLimitInput, setBulkLimitInput] = useState<string>("");
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);

  // Calculate weight sum
  const isWeightValid = Math.abs(weightSum - 1.0) < 0.001;

  // Filter users by team
  const filteredUsers =
    selectedTeamFilter === "all"
      ? users
      : users.filter((u) => u.teamId === selectedTeamFilter);

  // Get utilization color
  const getUtilizationColor = (utilization: number) => {
    if (utilization < 70) return "text-green-600";
    if (utilization < 90) return "text-yellow-600";
    return "text-red-600";
  };

  // Get utilization badge variant
  const getUtilizationBadge = (utilization: number) => {
    if (utilization < 70) return "default";
    if (utilization < 90) return "secondary";
    return "destructive";
  };

  // Handle weight change
  const handleWeightChange = (
    key: "weightWorkload" | "weightSkill" | "weightSLA" | "weightRandom",
    value: number
  ) => {
    setConfig((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Save configuration
  const handleSaveConfig = async () => {
    if (!isWeightValid) {
      toast.error("Lỗi", `Tổng trọng số phải = 1.0 (hiện tại: ${weightSum.toFixed(3)})`);
      return;
    }

    setIsSavingConfig(true);

    try {
      const result = await updateAssignmentConfig({
        weightWorkload: config.weightWorkload,
        weightSkill: config.weightSkill,
        weightSLA: config.weightSLA,
        weightRandom: config.weightRandom,
        enableAutoAssign: config.enableAutoAssign,
        advancedSettings: cloneAdvancedSettings(config.advancedSettings),
      });

      if (result.success) {
        toast.success("Thành công", "Đã cập nhật cấu hình assignment");
        router.refresh();
      } else {
        toast.error("Lỗi", result.error || "Không thể cập nhật cấu hình");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi";
      toast.error("Lỗi", errorMessage);
    } finally {
      setIsSavingConfig(false);
    }
  };

  // Handle team limit update
  const handleSaveTeamLimit = async (teamId: string) => {
    const newLimit = parseInt(teamLimitInput, 10);

    if (isNaN(newLimit) || newLimit < 1) {
      toast.error("Lỗi", "Giới hạn phải là số nguyên dương");
      return;
    }

    try {
      const result = await updateTeamWIPLimit(teamId, newLimit);

      if (result.success) {
        toast.success("Thành công", `Đã cập nhật giới hạn WIP cho ${result.teamName}`);
        setEditingTeamId(null);
        setTeamLimitInput("");
        router.refresh();
      } else {
        toast.error("Lỗi", result.error || "Không thể cập nhật giới hạn");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi";
      toast.error("Lỗi", errorMessage);
    }
  };

  // Handle bulk user update
  const handleBulkUpdate = async () => {
    if (selectedUsers.size === 0) {
      toast.error("Chưa chọn user", "Vui lòng chọn ít nhất 1 user");
      return;
    }

    const newLimit = parseInt(bulkLimitInput, 10);

    if (isNaN(newLimit) || newLimit < 1) {
      toast.error("Lỗi", "Giới hạn phải là số nguyên dương");
      return;
    }

    // Check if any user has more active tasks than new limit
    const invalidUsers = filteredUsers.filter(
      (u) => selectedUsers.has(u.id) && u.currentActiveTasks > newLimit
    );

    if (invalidUsers.length > 0) {
      const names = invalidUsers.map((u) => u.name).join(", ");
      toast.warning("Cảnh báo", `${invalidUsers.length} user có số task đang làm > giới hạn mới: ${names}`);
      return;
    }

    setIsBulkUpdating(true);

    try {
      const updates = Array.from(selectedUsers).map((userId) => ({
        userId,
        newLimit,
      }));

      const result = await bulkUpdateWIPLimits(updates);

      if (result.success) {
        toast.success("Thành công", `Đã cập nhật ${result.successCount} user`);
        setSelectedUsers(new Set());
        setBulkLimitInput("");
        router.refresh();
      } else {
        toast.error("Lỗi", result.error || "Một số cập nhật không thành công");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Đã xảy ra lỗi";
      toast.error("Lỗi", errorMessage);
    } finally {
      setIsBulkUpdating(false);
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string, checked?: boolean) => {
    const newSelected = new Set(selectedUsers);
    if (checked !== undefined) {
      // Set specific state
      if (checked) {
        newSelected.add(userId);
      } else {
        newSelected.delete(userId);
      }
    } else {
      // Toggle
      if (newSelected.has(userId)) {
        newSelected.delete(userId);
      } else {
        newSelected.add(userId);
      }
    }
    setSelectedUsers(newSelected);
  };

  // Toggle all users
  const toggleAllUsers = (checked?: boolean) => {
    if (checked !== undefined) {
      // Set specific state
      if (checked) {
        setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
      } else {
        setSelectedUsers(new Set());
      }
    } else {
      // Toggle
      if (selectedUsers.size === filteredUsers.length) {
        setSelectedUsers(new Set());
      } else {
        setSelectedUsers(new Set(filteredUsers.map((u) => u.id)));
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Section 1: Assignment Weights */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Bộ trọng số & tối ưu điểm (CONF_W)
              </CardTitle>
              <CardDescription>
                Kiểm soát trọng số thuật toán, modifiers nâng cao và xem mô phỏng realtime.
              </CardDescription>
            </div>
            <Button
              onClick={handleSaveConfig}
              disabled={!isWeightValid || isSavingConfig}
            >
              {isSavingConfig ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Đang lưu...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Lưu cấu hình
                </>
              )}
            </Button>
          </div>
        </CardHeader>

        <CardContent className="space-y-8">
          {/* Weight Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {weightDistribution.map((item) => (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{item.label}</label>
                  <span className="text-sm font-semibold text-primary">
                    {(item.value * 100).toFixed(0)}%
                  </span>
                </div>
                <Slider
                  value={[item.value]}
                  onValueChange={(values) =>
                    handleWeightChange(
                      item.label === "Workload"
                        ? "weightWorkload"
                        : item.label === "Skill"
                        ? "weightSkill"
                        : item.label === "SLA"
                        ? "weightSLA"
                        : "weightRandom",
                      Number(values[0].toFixed(2))
                    )
                  }
                  min={0}
                  max={1}
                  step={0.05}
                  className="w-full"
                />
                <p className="text-xs text-gray-600">
                  {item.label === "Workload" &&
                    "Giảm tải cho thành viên đang quá tải, ưu tiên người còn sức chứa."}
                  {item.label === "Skill" &&
                    "Tăng điểm cho thành viên có kỹ năng/điểm competency phù hợp nhất."}
                  {item.label === "SLA" &&
                    "Tập trung vào các yêu cầu có SLA sắp chạm hạn hoặc đang đỏ."}
                  {item.label === "Random" &&
                    "Booster nhẹ để tránh bias khi điểm quyền chọn ngang nhau."}
                </p>
              </div>
            ))}
          </div>

          {/* Sum Validation */}
          <div
            className={`flex flex-col gap-4 rounded-lg border-2 p-4 md:flex-row md:items-center md:justify-between ${
              isWeightValid ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
            }`}
          >
            <div className="flex items-center gap-3">
              {isWeightValid ? (
                <CheckCircle2 className="w-5 h-5 text-green-600" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600" />
              )}
              <div>
                <span className="font-medium">Tổng trọng số: {weightSum.toFixed(3)}</span>
                <p className="text-xs text-gray-600">
                  Sai lệch: {(Math.abs(weightSum - 1) * 100).toFixed(1)}%. Cân đối để thuật toán ổn định.
                </p>
              </div>
            </div>
            {isWeightValid ? (
              <Badge variant="default" className="w-fit bg-green-500">
                Hợp lệ
              </Badge>
            ) : (
              <Badge variant="destructive" className="w-fit">
                Phải = 1.0
              </Badge>
            )}
          </div>

          {/* Weight Snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {weightDistribution.map((factor) => (
              <div
                key={`dist-${factor.label}`}
                className="rounded-lg border border-gray-200 bg-white px-3 py-2"
              >
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">{factor.label}</span>
                  <Badge variant="outline" className="font-semibold">
                    {(factor.value * 100).toFixed(0)}%
                  </Badge>
                </div>
                <div className="mt-2 h-2 rounded-full bg-gray-200">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${factor.value * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          {/* Score Modifiers */}
          <div className="space-y-4">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <h4 className="flex items-center gap-2 font-semibold">
                <Sparkles className="h-4 w-4 text-primary" />
                Điều chỉnh bổ trợ (Score Modifiers)
              </h4>
              <Badge variant="outline" className="w-fit">
                Áp dụng realtime trong mô phỏng
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Boost theo thâm niên</span>
                  <span className="font-semibold text-primary">
                    +{Math.round(advancedSettings.scoreModifiers.seniorityBoost * 100)}%
                  </span>
                </div>
                <Slider
                  value={[advancedSettings.scoreModifiers.seniorityBoost]}
                  onValueChange={(values) =>
                    updateAdvancedSection("scoreModifiers", {
                      seniorityBoost: Number(values[0].toFixed(2)),
                    })
                  }
                  min={0}
                  max={0.4}
                  step={0.01}
                  className="mt-3"
                />
                <p className="mt-2 text-xs text-gray-600">
                  Đảm bảo các task phức tạp ưu tiên thành viên giàu kinh nghiệm.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Ưu tiên cross-skill</span>
                  <span className="font-semibold text-primary">
                    +{Math.round(advancedSettings.scoreModifiers.crossSkillBoost * 100)}%
                  </span>
                </div>
                <Slider
                  value={[advancedSettings.scoreModifiers.crossSkillBoost]}
                  onValueChange={(values) =>
                    updateAdvancedSection("scoreModifiers", {
                      crossSkillBoost: Number(values[0].toFixed(2)),
                    })
                  }
                  min={0}
                  max={0.4}
                  step={0.01}
                  className="mt-3"
                />
                <p className="mt-2 text-xs text-gray-600">
                  Khuyến khích luân chuyển & huấn luyện kỹ năng chéo trong team.
                </p>
              </div>

              <div className="rounded-lg border border-gray-200 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium">Penalty burnout</span>
                  <span className="font-semibold text-red-600">
                    -{Math.round(advancedSettings.scoreModifiers.burnoutPenalty * 100)}%
                  </span>
                </div>
                <Slider
                  value={[advancedSettings.scoreModifiers.burnoutPenalty]}
                  onValueChange={(values) =>
                    updateAdvancedSection("scoreModifiers", {
                      burnoutPenalty: Number(values[0].toFixed(2)),
                    })
                  }
                  min={0}
                  max={0.5}
                  step={0.01}
                  className="mt-3"
                />
                <p className="mt-2 text-xs text-gray-600">
                  Giảm điểm cho thành viên vừa hoàn thành nhiều task để tránh kiệt sức.
                </p>
              </div>
            </div>
          </div>

          {/* Live Simulation */}
          <div className="space-y-4 rounded-lg bg-gray-50 p-4">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h4 className="flex items-center gap-2 font-semibold">
                  <Gauge className="h-4 w-4 text-primary" />
                  Live simulation: {selectedScenario.label}
                </h4>
                <p className="text-xs text-gray-600">{selectedScenario.description}</p>
              </div>
              <Select
                value={previewScenario}
                onValueChange={(value) => setPreviewScenario(value as PreviewScenarioKey)}
              >
                <SelectTrigger className="w-[240px] bg-white">
                  <SelectValue placeholder="Chọn kịch bản mô phỏng" />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(previewScenarios) as PreviewScenarioKey[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {previewScenarios[key].label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              {previewScores.map((user) => {
                const isTop = user.score === highestPreviewScore;
                return (
                  <div
                    key={user.id}
                    className={`flex flex-col gap-1 rounded-md border px-3 py-3 text-sm md:flex-row md:items-center md:justify-between ${
                      isTop ? "border-primary bg-primary/5" : "border-gray-200 bg-white"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{user.name}</p>
                      <p className="text-xs text-gray-600">
                        Workload {(user.workloadFactor * 100).toFixed(0)}% · Skill{" "}
                        {(user.skillFactor * 100).toFixed(0)}% · SLA{" "}
                        {(user.slaFactor * 100).toFixed(0)}%
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-gray-900">
                        {(user.score * 100).toFixed(1)} điểm
                      </div>
                      <Badge variant={isTop ? "default" : "outline"}>
                        {isTop ? "Đề xuất" : "Cân nhắc"}
                      </Badge>
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="text-xs text-gray-500">
              *Modifiers: Seniority +{Math.round(advancedSettings.scoreModifiers.seniorityBoost * 100)}%, Cross-skill
              +{Math.round(advancedSettings.scoreModifiers.crossSkillBoost * 100)}%, Burnout -{Math.round(
                advancedSettings.scoreModifiers.burnoutPenalty * 100
              )}% · Backlog aging boost {Math.round(advancedSettings.guardrails.backlogAgingBoost * 100)}%.
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Section 1.1: Matching Strategy */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                Chiến lược matching & fallback
              </CardTitle>
              <CardDescription>
                Tinh chỉnh cách hệ thống ghép skill, xử lý case thiếu resource và ưu tiên fallback.
              </CardDescription>
            </div>
            <Badge variant="outline" className="w-fit">
              {matchingSummary}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-medium">Chế độ matching</label>
              <Select
                value={advancedSettings.matching.mode}
                onValueChange={(value) =>
                  updateAdvancedSection("matching", {
                    mode: value as AdvancedAssignmentSettings["matching"]["mode"],
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn chế độ matching" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strict">Strict – chỉ nhận skill 100%</SelectItem>
                  <SelectItem value="balanced">Balanced – ưu tiên chính, mở rộng nhẹ</SelectItem>
                  <SelectItem value="flexible">Flexible – mở rộng tối đa, chống backlog</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                {matchingModeDescriptions[advancedSettings.matching.mode]}
              </p>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium">Fallback strategy</label>
              <Select
                value={advancedSettings.matching.fallbackStrategy}
                onValueChange={(value) =>
                  updateAdvancedSection("matching", {
                    fallbackStrategy: value as AdvancedAssignmentSettings["matching"]["fallbackStrategy"],
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Chọn fallback" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="smart_balance">Smart balance</SelectItem>
                  <SelectItem value="round_robin">Round robin</SelectItem>
                  <SelectItem value="manual_gate">Manual gate</SelectItem>
                  <SelectItem value="random_spread">Random spread</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-600">
                {fallbackStrategyDescriptions[advancedSettings.matching.fallbackStrategy]}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
              <div>
                <p className="text-sm font-medium">Ưu tiên khớp tuyệt đối</p>
                <p className="text-xs text-gray-600">
                  Khi skill khớp 100%, hệ thống boost thêm điểm trước khi fallback.
                </p>
              </div>
              <Switch
                checked={advancedSettings.matching.prioritizeExactMatch}
                onCheckedChange={(checked) =>
                  updateAdvancedSection("matching", { prioritizeExactMatch: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
              <div>
                <p className="text-sm font-medium">Cho phép partial match</p>
                <p className="text-xs text-gray-600">
                  Dành cho task ít critical, giúp giảm backlog khi thiếu skill chính.
                </p>
              </div>
              <Switch
                checked={advancedSettings.matching.allowPartialMatch}
                onCheckedChange={(checked) =>
                  updateAdvancedSection("matching", { allowPartialMatch: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 1.2: Guardrails & Automation */}
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Guardrails & automation
              </CardTitle>
              <CardDescription>
                Thiết lập giới hạn tải, booster backlog và các automation xử lý quá hạn.
              </CardDescription>
            </div>
            <div className="flex flex-col items-start gap-1 text-xs text-gray-600 md:items-end">
              <span>{guardrailSummary}</span>
              <span>{automationSummary}</span>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-semibold">
                <ShieldCheck className="h-4 w-4 text-primary" />
                Guardrails WIP
              </h4>
              <div className="space-y-3">
                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <label className="text-xs font-medium uppercase text-gray-500">
                    Giới hạn task / user / ngày
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={advancedSettings.guardrails.maxAssignmentsPerUserPerDay}
                    onChange={(e) =>
                      handleGuardrailNumberChange(
                        "maxAssignmentsPerUserPerDay",
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className="mt-2 h-9"
                  />
                  <p className="mt-2 text-xs text-gray-600">0 = Không giới hạn, đề xuất 12-18 task.</p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <label className="text-xs font-medium uppercase text-gray-500">
                    Cooldown giữa 2 lần auto-assign (phút)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={advancedSettings.guardrails.cooldownMinutes}
                    onChange={(e) =>
                      handleGuardrailNumberChange(
                        "cooldownMinutes",
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className="mt-2 h-9"
                  />
                  <p className="mt-2 text-xs text-gray-600">
                    Giúp tránh spam auto-assign, đặc biệt trong giờ cao điểm.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <label className="text-xs font-medium uppercase text-gray-500">
                    SLA grace (% cho phép trễ)
                  </label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={advancedSettings.guardrails.slaGracePercent}
                    onChange={(e) =>
                      handleGuardrailNumberChange(
                        "slaGracePercent",
                        Math.min(100, Math.max(0, Number(e.target.value) || 0))
                      )
                    }
                    className="mt-2 h-9"
                  />
                  <p className="mt-2 text-xs text-gray-600">
                    Cho phép chậm tối đa trước khi đánh dấu vi phạm SLA.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Backlog aging boost</span>
                    <span className="font-semibold text-primary">
                      +{Math.round(advancedSettings.guardrails.backlogAgingBoost * 100)}%
                    </span>
                  </div>
                  <Slider
                    value={[advancedSettings.guardrails.backlogAgingBoost]}
                    onValueChange={(values) =>
                      handleGuardrailNumberChange(
                        "backlogAgingBoost",
                        Number(values[0].toFixed(2))
                      )
                    }
                    min={0}
                    max={0.5}
                    step={0.01}
                    className="mt-3"
                  />
                  <p className="mt-2 text-xs text-gray-600">
                    Tự tăng điểm cho backlog “già” để đẩy lên ưu tiên cao hơn.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="flex items-center gap-2 font-semibold">
                <Bot className="h-4 w-4 text-primary" />
                Automation & escalation
              </h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                  <div>
                    <p className="text-sm font-medium">Auto escalate task bị kẹt</p>
                    <p className="text-xs text-gray-600">
                      Gửi cảnh báo leader khi task quá hạn xử lý hoặc chạm WIP.
                    </p>
                  </div>
                  <Switch
                    checked={advancedSettings.automation.autoEscalateStalled}
                    onCheckedChange={(checked) =>
                      handleAutomationChange("autoEscalateStalled", checked)
                    }
                  />
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <label className="text-xs font-medium uppercase text-gray-500">
                    Escalate sau (giờ)
                  </label>
                  <Input
                    type="number"
                    min={1}
                    value={advancedSettings.automation.escalateAfterHours}
                    onChange={(e) =>
                      handleAutomationChange(
                        "escalateAfterHours",
                        Math.max(1, Number(e.target.value) || 1)
                      )
                    }
                    className="mt-2 h-9"
                  />
                  <p className="mt-2 text-xs text-gray-600">
                    Leader sẽ nhận cảnh báo sau số giờ task không có cập nhật.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-white p-3">
                  <label className="text-xs font-medium uppercase text-gray-500">
                    Auto-assign backlog &gt; X giờ
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={advancedSettings.automation.autoAssignBacklogOlderThanHours}
                    onChange={(e) =>
                      handleAutomationChange(
                        "autoAssignBacklogOlderThanHours",
                        Math.max(0, Number(e.target.value) || 0)
                      )
                    }
                    className="mt-2 h-9"
                  />
                  <p className="mt-2 text-xs text-gray-600">
                    Đẩy các request chờ lâu vào auto-assign để tránh tồn đọng.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 1.3: Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BellRing className="h-5 w-5 text-primary" />
            Thông báo & cảnh báo
          </CardTitle>
          <CardDescription>
            Chủ động cảnh báo team khi vượt ngưỡng hoặc SLA sắp nguy hiểm.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
              <div>
                <p className="text-sm font-medium">Alert khi quá tải</p>
                <p className="text-xs text-gray-600">Gửi ngay khi user vượt giới hạn WIP.</p>
              </div>
              <Switch
                checked={advancedSettings.notifications.notifyOnOverload}
                onCheckedChange={(checked) =>
                  handleNotificationToggle("notifyOnOverload", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
              <div>
                <p className="text-sm font-medium">Cảnh báo SLA risk</p>
                <p className="text-xs text-gray-600">Ping leader khi task chạm {advancedSettings.guardrails.slaGracePercent}% grace.</p>
              </div>
              <Switch
                checked={advancedSettings.notifications.notifyOnSlaRisk}
                onCheckedChange={(checked) =>
                  handleNotificationToggle("notifyOnSlaRisk", checked)
                }
              />
            </div>

            <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
              <div>
                <p className="text-sm font-medium">Weekly digest</p>
                <p className="text-xs text-gray-600">
                  Tổng hợp hiệu suất & cảnh báo gửi qua email/telegram hằng tuần.
                </p>
              </div>
              <Switch
                checked={advancedSettings.notifications.sendWeeklyDigest}
                onCheckedChange={(checked) =>
                  handleNotificationToggle("sendWeeklyDigest", checked)
                }
              />
            </div>
          </div>
          <p className="text-xs text-gray-500">
            Gợi ý: kết nối Telegram bot để nhận cảnh báo realtime; email digest phù hợp cho quản lý cấp cao.
          </p>
        </CardContent>
      </Card>

      {/* Section 2: Team WIP Limits */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Team WIP Limits (CONF_WIP)
          </CardTitle>
          <CardDescription>
            Click vào giới hạn để chỉnh sửa inline
          </CardDescription>
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">Members</TableHead>
                <TableHead className="text-center">Team Limit</TableHead>
                <TableHead className="text-center">Active Tasks</TableHead>
                <TableHead className="text-center">Avg Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className="font-medium">{team.name}</TableCell>
                  <TableCell className="text-center">{team.totalMembers}</TableCell>
                  <TableCell className="text-center">
                    {editingTeamId === team.id ? (
                      <div className="flex items-center gap-2 justify-center">
                        <Input
                          type="number"
                          value={teamLimitInput}
                          onChange={(e) => setTeamLimitInput(e.target.value)}
                          className="w-20 h-8"
                          min={1}
                          autoFocus
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSaveTeamLimit(team.id)}
                        >
                          <CheckCircle2 className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingTeamId(null);
                            setTeamLimitInput("");
                          }}
                        >
                          ×
                        </Button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingTeamId(team.id);
                          setTeamLimitInput(team.wipLimit.toString());
                        }}
                        className="px-3 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        {team.wipLimit}
                      </button>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <span
                      className={getUtilizationColor(team.avgUtilization)}
                    >
                      {team.totalActiveTasks}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getUtilizationBadge(team.avgUtilization)}>
                      {team.avgUtilization}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 3: User WIP Limits */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5 text-primary" />
                User WIP Limits
              </CardTitle>
              <CardDescription>
                Chọn users và bulk edit hoặc click inline
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedTeamFilter} onValueChange={setSelectedTeamFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Lọc theo team" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả teams</SelectItem>
                  {teams.map((team) => (
                    <SelectItem key={team.id} value={team.id}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Bulk Edit Controls */}
          {selectedUsers.size > 0 && (
            <div className="flex items-center gap-3 mt-4 p-3 bg-primary/10 rounded-lg">
              <span className="text-sm font-medium">
                Đã chọn: {selectedUsers.size} users
              </span>
              <Input
                type="number"
                placeholder="Giới hạn mới"
                value={bulkLimitInput}
                onChange={(e) => setBulkLimitInput(e.target.value)}
                className="w-32 h-9"
                min={1}
              />
              <Button
                size="sm"
                onClick={handleBulkUpdate}
                disabled={isBulkUpdating}
              >
                {isBulkUpdating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  `Bulk Edit (${selectedUsers.size})`
                )}
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={selectedUsers.size === filteredUsers.length}
                    onCheckedChange={(checked) => toggleAllUsers(!!checked)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead>User</TableHead>
                <TableHead>Team</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Current</TableHead>
                <TableHead className="text-center">Limit</TableHead>
                <TableHead className="text-center">Utilization</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Checkbox
                      checked={selectedUsers.has(user.id)}
                      onCheckedChange={(checked) => toggleUserSelection(user.id, !!checked)}
                      aria-label="Select row"
                    />
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-gray-600">{user.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{user.teamName}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="outline">{user.role}</Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={getUtilizationColor(user.utilization)}>
                      {user.currentActiveTasks}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">{user.wipLimit}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant={getUtilizationBadge(user.utilization)}>
                      {user.utilization}%
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Section 4: Auto-Assign Toggle */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            Auto-Assign Settings
          </CardTitle>
          <CardDescription>
            Bật/tắt tính năng tự động phân công toàn hệ thống
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <h4 className="font-medium mb-1">Enable Auto-Assign</h4>
              <p className="text-sm text-gray-600">
                Cho phép leaders sử dụng nút "Tự động phân công"
              </p>
            </div>
            <Switch
              checked={config.enableAutoAssign}
              onCheckedChange={(checked) =>
                setConfig((prev) => ({ ...prev, enableAutoAssign: checked }))
              }
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Success Rate</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {autoAssignStats.successRate}%
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Total Assigned</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {autoAssignStats.totalAutoAssignments}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <Zap className="w-4 h-4 text-yellow-600" />
                <span className="text-sm text-gray-600">Last Week</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">
                {autoAssignStats.lastWeekCount}
              </div>
            </div>

            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircle className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Last Assign</span>
              </div>
              <div className="text-sm font-semibold text-gray-900">
                {new Date(autoAssignStats.lastAutoAssignTime).toLocaleString("vi-VN")}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

