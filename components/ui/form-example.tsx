/**
 * Form Components Example
 * 
 * This file demonstrates all form components with modern styling.
 * Use this as a reference for implementing forms in your application.
 */

import * as React from "react";
import { Input } from "./input";
import { Label } from "./label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Textarea } from "./textarea";
import { Checkbox } from "./checkbox";
import { Radio } from "./radio";
import { Button } from "./button";
import { FormError } from "./form-error";

export function FormExample() {
  const [formData, setFormData] = React.useState({
    email: "",
    password: "",
    role: "",
    description: "",
    terms: false,
    notification: "email",
  });

  const [errors, setErrors] = React.useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple validation
    const newErrors: Record<string, string> = {};
    
    if (!formData.email) {
      newErrors.email = "Email là bắt buộc";
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Email không hợp lệ";
    }
    
    if (!formData.password) {
      newErrors.password = "Mật khẩu là bắt buộc";
    } else if (formData.password.length < 6) {
      newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    
    if (!formData.role) {
      newErrors.role = "Vui lòng chọn vai trò";
    }
    
    if (!formData.terms) {
      newErrors.terms = "Bạn phải đồng ý với điều khoản";
    }
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      console.log("Form submitted:", formData);
      alert("Form hợp lệ! Check console.");
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-dark-900 mb-2">Form Components Demo</h1>
      <p className="text-gray-600 mb-8">Modern form styling with BC Agency colors</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Input Example */}
        <div>
          <Label htmlFor="email" required>
            Email Address
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            error={!!errors.email}
          />
          <FormError message={errors.email} />
        </div>

        {/* Input with Error */}
        <div>
          <Label htmlFor="password" required>
            Password
          </Label>
          <Input
            id="password"
            type="password"
            placeholder="Minimum 6 characters"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            error={!!errors.password}
          />
          <FormError message={errors.password} />
        </div>

        {/* Select Example */}
        <div>
          <Label htmlFor="role" required>
            Vai trò
          </Label>
          <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
            <SelectTrigger id="role">
              <SelectValue placeholder="Chọn vai trò" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Quản trị viên</SelectItem>
              <SelectItem value="leader">Trưởng nhóm</SelectItem>
              <SelectItem value="assignee">Nhân viên</SelectItem>
              <SelectItem value="requester">Người yêu cầu</SelectItem>
            </SelectContent>
          </Select>
          <FormError message={errors.role} />
        </div>

        {/* Textarea Example */}
        <div>
          <Label htmlFor="description">
            Mô tả (tùy chọn)
          </Label>
          <Textarea
            id="description"
            placeholder="Nhập mô tả..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
          />
        </div>

        {/* Checkbox Example */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id="terms"
            checked={formData.terms}
            onCheckedChange={(checked) => setFormData({ ...formData, terms: !!checked })}
          />
          <Label htmlFor="terms" className="cursor-pointer">
            Tôi đồng ý với điều khoản và điều kiện
          </Label>
        </div>
        <FormError message={errors.terms} />

        {/* Radio Group Example */}
        <div>
          <Label>Thông báo qua</Label>
          <div className="space-y-2 mt-2">
            <Radio
              id="notification-email"
              name="notification"
              label="Email"
              value="email"
              checked={formData.notification === "email"}
              onChange={(e) => setFormData({ ...formData, notification: e.target.value })}
            />
            <Radio
              id="notification-telegram"
              name="notification"
              label="Telegram"
              value="telegram"
              checked={formData.notification === "telegram"}
              onChange={(e) => setFormData({ ...formData, notification: e.target.value })}
            />
            <Radio
              id="notification-both"
              name="notification"
              label="Cả hai"
              value="both"
              checked={formData.notification === "both"}
              onChange={(e) => setFormData({ ...formData, notification: e.target.value })}
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-4">
          <Button type="submit">
            Submit Form
          </Button>
          <Button type="button" variant="secondary" onClick={() => {
            setFormData({
              email: "",
              password: "",
              role: "",
              description: "",
              terms: false,
              notification: "email",
            });
            setErrors({});
          }}>
            Reset
          </Button>
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </div>
      </form>

      {/* Component Reference */}
      <div className="mt-12 p-6 bg-gray-50 rounded-xl">
        <h2 className="text-xl font-bold text-dark-900 mb-4">Component Reference</h2>
        
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-dark-800 mb-1">Input</h3>
            <code className="text-xs bg-white px-2 py-1 rounded">
              {'<Input error={!!error} placeholder="..." />'}
            </code>
          </div>

          <div>
            <h3 className="font-semibold text-dark-800 mb-1">Label</h3>
            <code className="text-xs bg-white px-2 py-1 rounded">
              {'<Label required>Field Name</Label>'}
            </code>
          </div>

          <div>
            <h3 className="font-semibold text-dark-800 mb-1">Select</h3>
            <code className="text-xs bg-white px-2 py-1 rounded block">
              {'<Select value={value} onValueChange={setValue}>'}
              <br />
              {'  <SelectTrigger><SelectValue /></SelectTrigger>'}
              <br />
              {'  <SelectContent><SelectItem value="1">Item</SelectItem></SelectContent>'}
              <br />
              {'</Select>'}
            </code>
          </div>

          <div>
            <h3 className="font-semibold text-dark-800 mb-1">Textarea</h3>
            <code className="text-xs bg-white px-2 py-1 rounded">
              {'<Textarea error={!!error} rows={4} />'}
            </code>
          </div>

          <div>
            <h3 className="font-semibold text-dark-800 mb-1">Checkbox</h3>
            <code className="text-xs bg-white px-2 py-1 rounded block">
              {'<div className="flex items-center space-x-2">'}
              <br />
              {'  <Checkbox checked={checked} onCheckedChange={...} />'}
              <br />
              {'  <Label htmlFor="id">Label</Label>'}
              <br />
              {'</div>'}
            </code>
          </div>

          <div>
            <h3 className="font-semibold text-dark-800 mb-1">Radio</h3>
            <code className="text-xs bg-white px-2 py-1 rounded">
              {'<Radio name="group" label="Option" value="1" />'}
            </code>
          </div>

          <div>
            <h3 className="font-semibold text-dark-800 mb-1">FormError</h3>
            <code className="text-xs bg-white px-2 py-1 rounded">
              {'<FormError message={errors.field} />'}
            </code>
          </div>
        </div>
      </div>
    </div>
  );
}

