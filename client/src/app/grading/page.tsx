"use client";
import React, { useState } from 'react';

const students = [
  { id: 1, name: "Alice Johnson", aiGrade: "A", finalGrade: "", github: "https://github.com/alice/bst", status: "On Track" },
  { id: 2, name: "Bob Smith", aiGrade: "B+", finalGrade: "", github: "https://github.com/bob/bst", status: "Warning" },
  { id: 3, name: "Charlie Davis", aiGrade: "A-", finalGrade: "A-", github: "https://github.com/charlie/bst", status: "On Track" },
];

export default function GradingDashboard() {
  return (
    <div className="min-h-screen bg-g-grey p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-medium text-gray-800">HW 1: Binary Search Trees</h1>
            <span className="text-sm text-gray-500 bg-white px-3 py-1 rounded-full border">18 of 28 graded</span>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm border border-g-border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">AI Analysis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Suggested</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Final Grade</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-200 text-red-800 flex items-center justify-center font-bold text-xs">
                            {student.name.split(' ').map(n=>n[0]).join('')}
                        </div>
                        <div>
                            <div className="text-sm font-medium text-gray-900">{student.name}</div>
                            <a href={student.github} target="_blank" className="text-xs text-blue-500 hover:underline">View GitHub</a>
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-bold rounded ${student.status === 'On Track' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                        {student.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 font-bold">
                    {student.aiGrade}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select className="bg-white border border-gray-300 rounded p-2 text-sm focus:ring-blue-500">
                      <option>--</option>
                      <option>A</option>
                      <option>A-</option>
                      <option>B+</option>
                      <option>B</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}