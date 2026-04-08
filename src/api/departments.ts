import type { components } from "@/api/contracts";
import { apiRequest } from "@/api/client";

export type Department = components["schemas"]["Department"];
export type DepartmentWrite = components["schemas"]["DepartmentWrite"];

export async function fetchDepartments(): Promise<Department[]> {
  const res = await apiRequest<components["schemas"]["DepartmentListEnvelope"]>("/departments");
  return res.data;
}

export async function createDepartment(body: DepartmentWrite): Promise<Department> {
  const res = await apiRequest<components["schemas"]["DepartmentEnvelope"]>("/departments", {
    method: "POST",
    body,
  });
  return res.data;
}

export async function updateDepartment(id: number, body: DepartmentWrite): Promise<Department> {
  const res = await apiRequest<components["schemas"]["DepartmentEnvelope"]>(`/departments/${id}`, {
    method: "PATCH",
    body,
  });
  return res.data;
}

export async function deleteDepartment(id: number): Promise<void> {
  await apiRequest<void>(`/departments/${id}`, { method: "DELETE" });
}
