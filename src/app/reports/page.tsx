'use client';

import React, { useState, useEffect } from 'react';
import AppShell from '@/components/AppShell';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Filter,
  Calendar,
  Building2,
  Receipt,
  CreditCard,
  HandCoins,
  MinusCircle,
  Clock,
  ArrowRightLeft
} from 'lucide-react';

export default function ReportsPage() {
  const [reportType, setReportType] = useState('labour-payment');
  const [labours, setLabours] = useState<any[]>([]);
  const [selectedLabourId, setSelectedLabourId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportData, setReportData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load labour options
    fetch('/api/labour')
      .then((r) => r.json())
      .then((d) => {
        if (d.success) {
          setLabours(d.labours);
          if (d.labours.length > 0) {
            setSelectedLabourId(d.labours[0].id);
          }
        }
      });
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('type', reportType);
      if (reportType === 'individual-statement' && selectedLabourId) {
        params.append('labourId', selectedLabourId);
      } else if (selectedLabourId) {
        params.append('labourId', selectedLabourId);
      }
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await fetch(`/api/reports?${params.toString()}`);
      const data = await res.json();
      if (data.success) {
        setReportData(data);
      }
    } catch (err) {
      console.error('Report fetch error', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [reportType, selectedLabourId, startDate, endDate]);

  const handlePrint = () => {
    window.print();
  };

  const exportCSV = () => {
    if (!reportData) return;
    let csvRows: string[][] = [];

    if (reportType === 'individual-statement' && reportData.ledger) {
      csvRows.push(['Date', 'Type', 'Amount', 'Method', 'Ref', 'Running Payable', 'Running Advance']);
      reportData.ledger.forEach((l: any) => {
        csvRows.push([
          new Date(l.transactionDate).toISOString().slice(0, 10),
          l.typeLabel,
          l.amount.toString(),
          l.paymentMethod,
          `"${l.remarks || ''}"`,
          l.runningSalaryPayable.toString(),
          l.runningOutstandingAdvance.toString(),
        ]);
      });
    } else if (reportData.data) {
      csvRows.push(['Record Data', JSON.stringify(reportData.data)]);
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + csvRows.map((r) => r.join(',')).join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csvContent));
    link.setAttribute('download', `safe_report_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-[#59718A] tracking-wider uppercase">
              <span>Executive Reporting Console</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
              Reports & Statements
            </h2>
            <p className="text-xs text-[#59718A] mt-1">
              Official statements, payment summaries, advances, deductions & method breakdown
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handlePrint}
              className="px-4 py-2.5 bg-[#2F6F6D] hover:bg-[#285d5b] text-white text-xs font-bold rounded-2xl shadow-md shadow-[#2F6F6D]/20 transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Statement / PDF</span>
            </button>
            <button
              onClick={exportCSV}
              className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 text-xs font-bold rounded-2xl shadow-sm transition flex items-center gap-1.5"
            >
              <Download className="w-4 h-4 text-[#2F6F6D]" />
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* 9 Reports Selector Navigation */}
        <div className="no-print bg-white rounded-3xl p-4 shadow-sm border border-slate-100">
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'labour-payment', label: '1. Labour Payments' },
              { id: 'individual-statement', label: '2. Individual Statement' },
              { id: 'daily-payment', label: '3. Daily Summary' },
              { id: 'advance', label: '4. Advance Report' },
              { id: 'deduction', label: '5. Deduction Report' },
              { id: 'outstanding-balance', label: '6. Outstanding Balances' },
              { id: 'payment-method', label: '7. Payment Methods' },
            ].map((rep) => (
              <button
                key={rep.id}
                onClick={() => setReportType(rep.id)}
                className={`px-3.5 py-2 rounded-2xl text-xs font-bold transition ${
                  reportType === rep.id
                    ? 'bg-[#2F6F6D] text-white shadow-sm'
                    : 'bg-slate-50 text-slate-600 hover:bg-[#F2E9D8]'
                }`}
              >
                {rep.label}
              </button>
            ))}
          </div>

          {/* Filter Parameters */}
          <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center gap-4">
            {reportType === 'individual-statement' && (
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-600">Select Labour:</span>
                <select
                  value={selectedLabourId}
                  onChange={(e) => setSelectedLabourId(e.target.value)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-200 bg-white"
                >
                  {labours.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.id}) - {l.workType}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Period:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200"
              />
              <span className="text-xs text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-xs px-3 py-1.5 rounded-xl border border-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Report Canvas / Official Letterhead Container */}
        <div className="bg-white rounded-3xl p-8 sm:p-10 shadow-sm border border-slate-100 print-card">
          {/* SAFE SOLUTIONS Official Letterhead (Always rendered on print & screen) */}
          <div className="pb-6 border-b-2 border-slate-900 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-[#2F6F6D] text-[#F2E9D8] flex items-center justify-center font-black">
                <Building2 className="w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900">SAFE SOLUTIONS</h1>
                <p className="text-xs font-bold text-[#59718A] tracking-wider uppercase">
                  House of Construction Solutions
                </p>
                <p className="text-[11px] text-slate-500">Official Labour Payment & Ledger Management Office</p>
              </div>
            </div>

            <div className="text-left sm:text-right text-xs">
              <div className="text-[11px] font-bold text-[#2F6F6D] uppercase tracking-wider">
                {reportType.replace('-', ' ').toUpperCase()}
              </div>
              <div className="text-slate-500 mt-0.5">
                Generated: {new Date().toLocaleDateString('en-PK')}
              </div>
              {startDate && endDate && (
                <div className="text-[11px] text-slate-600 font-medium">
                  Period: {startDate} to {endDate}
                </div>
              )}
            </div>
          </div>

          {loading ? (
            <div className="py-16 text-center text-xs text-slate-400">Generating report...</div>
          ) : !reportData ? (
            <div className="py-16 text-center text-xs text-slate-400">No report data found.</div>
          ) : (
            <div className="mt-6 space-y-6">
              {/* Individual Statement Report */}
              {reportType === 'individual-statement' && reportData.labour && (
                <div className="space-y-6">
                  <div className="p-4 rounded-2xl bg-[#F2E9D8]/50 border border-[#F2E9D8] grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                    <div>
                      <div className="text-slate-500">Labour Name</div>
                      <div className="font-black text-slate-900 text-sm">{reportData.labour.name}</div>
                      {reportData.labour.fatherName && (
                        <div className="text-[10px] text-slate-500">s/o {reportData.labour.fatherName}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-slate-500">Labour ID</div>
                      <div className="font-mono font-bold text-slate-900">{reportData.labour.id}</div>
                      <div className="text-[10px] text-slate-500">{reportData.labour.workType}</div>
                    </div>
                    <div>
                      <div className="text-slate-500">Salary Agreement</div>
                      <div className="font-black text-slate-900">
                        Rs. {(reportData.labour.salaryType === 'DAILY' ? reportData.labour.dailyRate : reportData.labour.weeklyRate).toLocaleString()}
                        <span className="text-[10px] text-slate-500 ml-1 uppercase">/{reportData.labour.salaryType.toLowerCase()}</span>
                      </div>
                    </div>
                    <div>
                      <div className="text-slate-500">Current Salary Payable</div>
                      <div className="font-black text-base text-[#E07A47]">
                        Rs. {(reportData.balances?.salaryPayable || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  {/* Transaction Ledger Table */}
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50 text-[#59718A] font-bold text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Description</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3 text-right">Amount (Rs)</th>
                        <th className="py-2.5 px-3 text-right">Salary Payable</th>
                        <th className="py-2.5 px-3 text-right">Outst. Advance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.ledger && reportData.ledger.length > 0 ? (
                        reportData.ledger.map((l: any) => (
                          <tr key={l.id}>
                            <td className="py-2.5 px-3 font-mono text-slate-600">
                              {new Date(l.transactionDate).toLocaleDateString('en-PK')}
                            </td>
                            <td className="py-2.5 px-3 font-bold">{l.typeLabel}</td>
                            <td className="py-2.5 px-3 text-slate-600">{l.remarks || l.reference || '—'}</td>
                            <td className="py-2.5 px-3 text-slate-500">{l.paymentMethod}</td>
                            <td className="py-2.5 px-3 text-right font-black">
                              Rs. {l.amount.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                              Rs. {l.runningSalaryPayable.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-bold text-[#D4A72C]">
                              Rs. {l.runningOutstandingAdvance.toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={7} className="py-6 text-center text-slate-400">
                            No ledger transactions recorded in this period.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>

                  {/* Summary Totals */}
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-wrap items-center justify-between gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">Total Salary Due:</span>{' '}
                      <strong className="font-bold">Rs. {(reportData.balances?.totalSalaryDue || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Paid:</span>{' '}
                      <strong className="font-bold text-[#2F6F6D]">Rs. {(reportData.balances?.totalSalaryPaid || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Total Advances:</span>{' '}
                      <strong className="font-bold text-[#D4A72C]">Rs. {(reportData.balances?.totalAdvancesGiven || 0).toLocaleString()}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500">Remaining Salary Payable:</span>{' '}
                      <strong className="font-black text-sm text-[#E07A47]">Rs. {(reportData.balances?.salaryPayable || 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Labour Payment Report */}
              {reportType === 'labour-payment' && reportData.data && (
                <div>
                  <div className="mb-4 flex justify-between items-center text-xs">
                    <span className="text-slate-500">
                      Total Payments Recorded: <strong>{reportData.count}</strong>
                    </span>
                    <span className="text-sm font-black text-[#2F6F6D]">
                      Total Disbursed: Rs. {reportData.totalAmount?.toLocaleString()}
                    </span>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50 text-[#59718A] font-bold text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Labour</th>
                        <th className="py-2.5 px-3">Trade</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Ref / Cheque</th>
                        <th className="py-2.5 px-3 text-right">Amount (Rs)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.data.map((p: any) => (
                        <tr key={p.id}>
                          <td className="py-2.5 px-3 font-mono">{new Date(p.transactionDate).toLocaleDateString('en-PK')}</td>
                          <td className="py-2.5 px-3 font-bold">{p.labour?.name}</td>
                          <td className="py-2.5 px-3 text-slate-500">{p.labour?.workType}</td>
                          <td className="py-2.5 px-3">{p.paymentMethod}</td>
                          <td className="py-2.5 px-3 text-slate-500">{p.reference || '—'}</td>
                          <td className="py-2.5 px-3 text-right font-black text-[#2F6F6D]">
                            Rs. {p.amount.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Outstanding Balance Report */}
              {reportType === 'outstanding-balance' && reportData.data && (
                <div>
                  <div className="mb-3 text-xs text-slate-500">
                    Workers with active balances (Salary Payable or Outstanding Advance)
                  </div>
                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50 text-[#59718A] font-bold text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">ID</th>
                        <th className="py-2.5 px-3">Labour Name</th>
                        <th className="py-2.5 px-3">Trade</th>
                        <th className="py-2.5 px-3 text-right">Salary Payable</th>
                        <th className="py-2.5 px-3 text-right">Outstanding Advance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.data.map((b: any) => (
                        <tr key={b.id}>
                          <td className="py-2.5 px-3 font-mono font-bold text-[#59718A]">{b.id}</td>
                          <td className="py-2.5 px-3 font-bold">{b.name}</td>
                          <td className="py-2.5 px-3 text-slate-500">{b.workType}</td>
                          <td className="py-2.5 px-3 text-right font-black text-[#E07A47]">
                            Rs. {b.salaryPayable.toLocaleString()}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-[#D4A72C]">
                            Rs. {b.outstandingAdvance.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Advance Report */}
              {reportType === 'advance' && reportData.data && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-3 bg-slate-50 rounded-xl border">
                      <div className="text-slate-500">Total Advances Given</div>
                      <div className="font-bold text-slate-900 mt-0.5">Rs. {reportData.totalGiven?.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-slate-50 rounded-xl border">
                      <div className="text-slate-500">Adjusted Against Salary</div>
                      <div className="font-bold text-slate-900 mt-0.5">Rs. {reportData.totalAdjusted?.toLocaleString()}</div>
                    </div>
                    <div className="p-3 bg-[#D4A72C]/15 rounded-xl border border-[#D4A72C]/30">
                      <div className="text-[#9E7310] font-bold">Outstanding Advances</div>
                      <div className="font-black text-[#9E7310] text-sm mt-0.5">Rs. {reportData.outstanding?.toLocaleString()}</div>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-50 text-[#59718A] font-bold text-[10px] uppercase border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Date</th>
                        <th className="py-2.5 px-3">Labour</th>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-3">Method</th>
                        <th className="py-2.5 px-3">Remarks</th>
                        <th className="py-2.5 px-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportData.data.map((r: any) => (
                        <tr key={r.id}>
                          <td className="py-2.5 px-3 font-mono">{new Date(r.transactionDate).toLocaleDateString('en-PK')}</td>
                          <td className="py-2.5 px-3 font-bold">{r.labour?.name}</td>
                          <td className="py-2.5 px-3 font-semibold">{r.type.replace('_', ' ')}</td>
                          <td className="py-2.5 px-3 text-slate-500">{r.paymentMethod}</td>
                          <td className="py-2.5 px-3 text-slate-500">{r.remarks || '—'}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-[#D4A72C]">Rs. {r.amount.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Daily Summary */}
              {reportType === 'daily-payment' && reportData.data && (
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-50 text-[#59718A] font-bold text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Date</th>
                      <th className="py-2.5 px-3 text-center">Transactions</th>
                      <th className="py-2.5 px-3 text-right">Total Disbursed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.data.map((d: any) => (
                      <tr key={d.date}>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{d.date}</td>
                        <td className="py-2.5 px-3 text-center">{d.count} payments</td>
                        <td className="py-2.5 px-3 text-right font-black text-[#2F6F6D]">
                          Rs. {d.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {/* Payment Method Breakdown */}
              {reportType === 'payment-method' && reportData.data && (
                <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
                  <thead className="bg-slate-50 text-[#59718A] font-bold text-[10px] uppercase border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Payment Channel</th>
                      <th className="py-2.5 px-3 text-center">Transactions Count</th>
                      <th className="py-2.5 px-3 text-right">Total Transferred</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {reportData.data.map((m: any) => (
                      <tr key={m.method}>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{m.method}</td>
                        <td className="py-2.5 px-3 text-center">{m.count}</td>
                        <td className="py-2.5 px-3 text-right font-black text-slate-900">
                          Rs. {m.total.toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {/* Official Signature Blocks on Print */}
          <div className="hidden print:grid grid-cols-2 gap-12 pt-16 text-xs text-slate-600">
            <div className="border-t border-slate-400 pt-2">
              <div>Accounts Officer / Verified By</div>
              <div className="text-[10px] text-slate-400">SAFE SOLUTIONS Office Staff</div>
            </div>
            <div className="border-t border-slate-400 pt-2 text-right">
              <div>Chief Executive Authorization</div>
              <div className="text-[10px] text-slate-400">House of Construction Solutions</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
