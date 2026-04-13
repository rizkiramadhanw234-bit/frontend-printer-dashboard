"use client";

import React, { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Printer,
    Plus,
    Trash2,
    Check,
    Pencil,
    FolderOpen,
} from "lucide-react";
import { usePrinterGroupStore } from "@/store/printer.group.store";

// ─── Assign a single printer to a group ─────────────────────────────────────
export function AssignGroupModal({ printer, isOpen, onClose }) {
    const { groups, addGroup, assignPrinter, unassignPrinter, getGroupForPrinter } =
        usePrinterGroupStore();

    const [newGroupName, setNewGroupName] = useState("");
    const [showCreate, setShowCreate] = useState(false);

    if (!printer) return null;

    const currentGroup = getGroupForPrinter(printer.id);

    const handleAssign = (groupId) => {
        assignPrinter(printer.id, groupId);
        onClose();
    };

    const handleUnassign = () => {
        unassignPrinter(printer.id);
        onClose();
    };

    const handleCreateAndAssign = () => {
        if (!newGroupName.trim()) return;
        const groupId = addGroup(newGroupName.trim());
        assignPrinter(printer.id, groupId);
        setNewGroupName("");
        setShowCreate(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-sm">
                        <Printer className="h-4 w-4" />
                        Assign to Group —{" "}
                        <span className="font-normal text-gray-500 truncate">
                            {printer.display_name || printer.name}
                        </span>
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-3">
                    {/* Current group info */}
                    {currentGroup && (
                        <div className="flex items-center justify-between p-2 bg-gray-50 rounded-md text-sm">
                            <span className="text-gray-600">
                                Currently in{" "}
                                <span className="font-medium text-gray-900">{currentGroup.name}</span>
                            </span>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 text-xs text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={handleUnassign}
                            >
                                Remove
                            </Button>
                        </div>
                    )}

                    {/* Existing groups list */}
                    {groups.length === 0 && !showCreate ? (
                        <div className="text-center py-6 text-sm text-gray-400">
                            <FolderOpen className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                            No groups yet. Create your first group below.
                        </div>
                    ) : (
                        <div className="space-y-1 max-h-52 overflow-y-auto pr-1">
                            {groups.map((group) => {
                                const isCurrentGroup = currentGroup?.id === group.id;
                                return (
                                    <button
                                        key={group.id}
                                        onClick={() => handleAssign(group.id)}
                                        className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
                                            ${isCurrentGroup
                                                ? "bg-gray-100 text-gray-900 border border-gray-200"
                                                : "hover:bg-gray-50 text-gray-700"
                                            }`}
                                    >
                                        <div className="flex items-center gap-2">
                                            <FolderOpen className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                                            <span className="font-medium">{group.name}</span>
                                            <span className="text-xs text-gray-400">
                                                {group.printerIds.length} printer{group.printerIds.length !== 1 ? "s" : ""}
                                            </span>
                                        </div>
                                        {isCurrentGroup && <Check className="h-3.5 w-3.5 shrink-0 text-gray-600" />}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Create new group */}
                    {showCreate ? (
                        <div className="border border-dashed border-gray-300 rounded-md p-3 space-y-2">
                            <Input
                                placeholder="Nama group, contoh: Lantai 2"
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreateAndAssign()}
                                autoFocus
                                className="h-8 text-sm"
                            />
                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    className="h-7 text-xs flex-1"
                                    onClick={handleCreateAndAssign}
                                    disabled={!newGroupName.trim()}
                                >
                                    <Plus className="h-3 w-3 mr-1" />
                                    Create &amp; Assign
                                </Button>
                                <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-xs"
                                    onClick={() => { setShowCreate(false); setNewGroupName(""); }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-full h-8 text-xs border-dashed"
                            onClick={() => setShowCreate(true)}
                        >
                            <Plus className="h-3.5 w-3.5 mr-1.5" />
                            Create New Group
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ─── Manage all groups (rename, delete) ──────────────────────────────────────
export function ManageGroupsModal({ isOpen, onClose, allPrinters = [] }) {
    const { groups, addGroup, renameGroup, deleteGroup, getUngroupedIds } =
        usePrinterGroupStore();

    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState("");
    const [newGroupName, setNewGroupName] = useState("");

    const ungroupedCount = getUngroupedIds(allPrinters.map((p) => p.id)).length;

    const startEdit = (group) => {
        setEditingId(group.id);
        setEditName(group.name);
    };

    const commitEdit = () => {
        if (editName.trim()) renameGroup(editingId, editName.trim());
        setEditingId(null);
    };

    const handleCreate = () => {
        if (!newGroupName.trim()) return;
        addGroup(newGroupName.trim());
        setNewGroupName("");
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[420px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-sm">
                        <FolderOpen className="h-4 w-4" />
                        Manage Printer Groups
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Summary */}
                    <div className="flex gap-3 text-xs text-gray-500">
                        <span>{groups.length} group{groups.length !== 1 ? "s" : ""}</span>
                        <span>·</span>
                        <span>{allPrinters.length - ungroupedCount} assigned</span>
                        <span>·</span>
                        <span>{ungroupedCount} ungrouped</span>
                    </div>

                    {/* Groups list */}
                    <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                        {groups.length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No groups yet.</p>
                        ) : (
                            groups.map((group) => (
                                <div
                                    key={group.id}
                                    className="flex items-center gap-2 px-3 py-2 rounded-md bg-gray-50"
                                >
                                    <FolderOpen className="h-3.5 w-3.5 text-gray-400 shrink-0" />

                                    {editingId === group.id ? (
                                        <Input
                                            value={editName}
                                            onChange={(e) => setEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === "Enter") commitEdit();
                                                if (e.key === "Escape") setEditingId(null);
                                            }}
                                            onBlur={commitEdit}
                                            autoFocus
                                            className="h-6 text-sm flex-1 py-0"
                                        />
                                    ) : (
                                        <span className="flex-1 text-sm font-medium text-gray-800">
                                            {group.name}
                                        </span>
                                    )}

                                    <span className="text-xs text-gray-400 shrink-0">
                                        {group.printerIds.length}
                                    </span>

                                    <button
                                        onClick={() => startEdit(group)}
                                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-white text-gray-400 hover:text-gray-700 transition-colors"
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </button>
                                    <button
                                        onClick={() => deleteGroup(group.id)}
                                        className="h-6 w-6 flex items-center justify-center rounded hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Create new group */}
                    <div className="border-t pt-3 space-y-2">
                        <p className="text-xs font-medium text-gray-500">New Group</p>
                        <div className="flex gap-2">
                            <Input
                                placeholder='contoh: "Lantai 3" atau "Finance"'
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                                className="h-8 text-sm"
                            />
                            <Button
                                size="sm"
                                className="h-8 text-xs shrink-0"
                                onClick={handleCreate}
                                disabled={!newGroupName.trim()}
                            >
                                <Plus className="h-3.5 w-3.5 mr-1" />
                                Add
                            </Button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Button variant="outline" size="sm" className="h-8 text-xs" onClick={onClose}>
                            Done
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}