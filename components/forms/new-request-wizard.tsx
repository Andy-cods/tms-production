"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { FileText, Sparkles } from "lucide-react";
import { RequestFormStep2 } from "@/components/forms/request-form-step2";
import { RequestConfirmStep } from "@/components/forms/request-confirm-step";

type Category = { id: string; name: string; icon?: string; teamId?: string };
type Team = { id: string; name: string };

export default function NewRequestWizard({
  categories,
  teams,
}: {
  categories: Category[];
  teams: Team[];
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [requestType, setRequestType] = useState<"catalog" | "custom" | null>(null);
  const [formData, setFormData] = useState<any>({});

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-4">
            <StepIndicator number={1} active={step === 1} completed={step > 1} label="Chọn loại" />
            <div className="hidden md:block w-20 h-1 bg-gray-300" />
            <StepIndicator number={2} active={step === 2} completed={step > 2} label="Thông tin" />
            <div className="hidden md:block w-20 h-1 bg-gray-300" />
            <StepIndicator number={3} active={step === 3} label="Xác nhận" />
          </div>
        </div>

        {/* Step 1: Chọn loại */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Tạo yêu cầu mới</h1>
              <p className="text-gray-600">Chọn loại yêu cầu phù hợp với nhu cầu của bạn</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Option A: Catalog */}
              <Card
                className={`p-8 cursor-pointer transition-all hover:shadow-xl border-2 ${
                  requestType === "catalog" ? "border-primary-500 bg-primary-50" : "border-gray-200 hover:border-primary-300"
                }`}
                onClick={() => setRequestType("catalog")}
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
                    <FileText className="h-8 w-8 text-primary-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Yêu cầu theo Catalog</h3>
                  <p className="text-gray-600 text-sm">Sử dụng mẫu có sẵn với phòng ban và phân loại rõ ràng</p>
                  <ul className="text-left text-sm text-gray-700 space-y-2">
                    <li>✓ Template có sẵn</li>
                    <li>✓ Phòng ban cố định</li>
                    <li>✓ Xử lý nhanh chóng</li>
                  </ul>
                </div>
              </Card>

              {/* Option B: Custom */}
              <Card
                className={`p-8 cursor-pointer transition-all hover:shadow-xl border-2 ${
                  requestType === "custom" ? "border-orange-500 bg-orange-50" : "border-gray-200 hover:border-orange-300"
                }`}
                onClick={() => setRequestType("custom")}
              >
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto">
                    <Sparkles className="h-8 w-8 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Yêu cầu Tùy chỉnh</h3>
                  <p className="text-gray-600 text-sm">Tạo yêu cầu đặc biệt, không thuộc catalog hiện có</p>
                  <ul className="text-left text-sm text-gray-700 space-y-2">
                    <li>✓ Linh hoạt 100%</li>
                    <li>✓ Tự chọn phòng ban</li>
                    <li>✓ Yêu cầu đột biến</li>
                  </ul>
                </div>
              </Card>
            </div>

            <div className="flex justify-center mt-8">
              <Button size="lg" className="bg-primary-500 hover:bg-primary-600 px-12" disabled={!requestType} onClick={() => setStep(2)}>
                Tiếp tục →
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Form fields (based on type) */}
        {step === 2 && requestType && (
          <RequestFormStep2
            requestType={requestType}
            categories={categories}
            teams={teams}
            onNext={(data: any) => {
              setFormData({ ...data, requestType });
              setStep(3);
            }}
            onBack={() => setStep(1)}
          />
        )}

        {/* Step 3: Confirm */}
        {step === 3 && (
          <RequestConfirmStep
            data={formData}
            onBack={() => setStep(2)}
          />
        )}
      </div>
    </div>
  );
}

function StepIndicator({
  number,
  active,
  completed,
  label,
}: {
  number: number;
  active?: boolean;
  completed?: boolean;
  label: string;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
          completed ? "bg-primary-500 text-white" : active ? "bg-primary-500 text-white" : "bg-gray-300 text-gray-600"
        }`}
      >
        {completed ? "✓" : number}
      </div>
      <span className="text-xs text-gray-600">{label}</span>
    </div>
  );
}


