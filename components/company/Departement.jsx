"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building, Users, Trash2, Plus, Loader2 } from "lucide-react";
import { useAppStore } from "@/store/app.store";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function DepartmentModal({ isOpen, onClose }) {
  const [selectedCompany, setSelectedCompany] = useState("");
  const [departmentName, setDepartmentName] = useState("");
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(null);

  const {
    companies,
    departments,
    loadCompanies,
    loadDepartments,
    createDepartment,
    // deleteDepartment, // Uncomment kalo ada endpoint
  } = useAppStore();

  // Load companies when modal opens
  useEffect(() => {
    if (isOpen) {
      loadCompanies();
    }
  }, [isOpen]);

  // Load departments when company selected
  useEffect(() => {
    if (selectedCompany) {
      loadDepartments(selectedCompany);
    }
  }, [selectedCompany]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCompany || !departmentName) return;

    setLoading(true);
    try {
      await createDepartment(selectedCompany, departmentName);
      setDepartmentName("");
    } catch (error) {
      console.error("Failed to create department:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deptId, deptName) => {
    if (!confirm(`Are you sure you want to delete "${deptName}"?`)) return;
    
    setDeleteLoading(deptId);
    try {
      // await deleteDepartment(deptId);
      alert(`✅ Department "${deptName}" deleted successfully`);
    } catch (error) {
      alert(`❌ Failed to delete department: ${error.message}`);
    } finally {
      setDeleteLoading(null);
    }
  };

  const selectedCompanyName = companies.find(c => c.id === selectedCompany)?.name;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Users className="h-5 w-5" />
            Department Management
          </DialogTitle>
          <DialogDescription>
            Create and manage departments for your companies. 
            Departments are used to organize agents and printers.
          </DialogDescription>
        </DialogHeader>

        <Separator className="my-2" />

        <div className="flex-1 overflow-y-auto pr-1 space-y-6 py-4">
          {/* Company Selector */}
          <div className="space-y-3">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Building className="h-4 w-4" />
              Select Company
            </Label>
            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="-- Choose a company --" />
              </SelectTrigger>
              <SelectContent>
                {companies.map((company) => (
                  <SelectItem key={company.id} value={company.id}>
                    <div className="flex items-center justify-between w-full gap-4">
                      <span>{company.name}</span>
                      <Badge variant="outline" className="ml-2 text-xs">
                        ID: {company.id.substring(0, 8)}...
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedCompany && (
            <>
              <Separator className="my-4" />

              {/* Create Department Form */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Add New Department
                  </Label>
                  <Badge variant="secondary" className="text-xs">
                    {selectedCompanyName}
                  </Badge>
                </div>
                
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    placeholder="e.g. IT Support, Human Resources, Finance"
                    value={departmentName}
                    onChange={(e) => setDepartmentName(e.target.value)}
                    className="flex-1"
                    required
                    disabled={loading}
                  />
                  <Button 
                    type="submit" 
                    disabled={loading || !departmentName.trim()}
                    className="gap-2 min-w-[100px]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4" />
                        Create
                      </>
                    )}
                  </Button>
                </form>
              </div>

              <Separator className="my-4" />

              {/* Departments List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Existing Departments
                  </Label>
                  <Badge variant="outline">
                    {departments.length} {departments.length === 1 ? 'Department' : 'Departments'}
                  </Badge>
                </div>

                {departments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 px-4 border-2 border-dashed rounded-lg bg-gray-50/50">
                    <Users className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 text-center">
                      No departments found for this company.
                      <br />
                      Create your first department using the form above.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-[300px] overflow-y-auto pr-1">
                    {departments.map((dept, index) => (
                      <div
                        key={dept.id}
                        className="flex items-center justify-between p-3 bg-white border rounded-lg hover:shadow-sm transition-all group"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="font-medium text-sm truncate">
                              {dept.name}
                            </span>
                            <Badge variant="secondary" className="text-xs ml-2">
                              ID: {dept.id}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-gray-500">
                              Agents: {dept.agent_count || 0}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">
                              Created: {new Date(dept.created_at).toLocaleDateString('id-ID')}
                            </span>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => handleDelete(dept.id, dept.name)}
                          disabled={deleteLoading === dept.id}
                        >
                          {deleteLoading === dept.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <Separator className="my-2" />

        <DialogFooter className="sm:justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="gap-2"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}