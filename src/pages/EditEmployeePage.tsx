import { Navigate, useParams } from "react-router-dom";
import { EmployeeFormPage } from "./EmployeeFormPage";

export default function EditEmployeePage() {
  const { id } = useParams();
  const employeeId = Number(id);
  if (!id || Number.isNaN(employeeId)) {
    return <Navigate to="/empleados" replace />;
  }
  return <EmployeeFormPage mode="edit" employeeId={employeeId} />;
}
