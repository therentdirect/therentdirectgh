"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

type Profile = {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  phone: string;
  created_at: string;
};

type UserPass = {
  id: string;
  user_email: string;
  status: string;
  expires_at: string | null;
  created_at: string;
};

export default function AdminUsersPage() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [passes, setPasses] = useState<UserPass[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    setLoading(true);
    setMessage("");

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (profileError) setMessage(profileError.message);

    const { data: passData } = await supabase
      .from("user_passes")
      .select("id,user_email,status,expires_at,created_at")
      .order("created_at", { ascending: false });

    if (profileData) setProfiles(profileData);
    if (passData) setPasses(passData);

    setLoading(false);
  }

  function getUserPass(email: string) {
    return passes.find((pass) => pass.user_email === email);
  }

  function passStatus(email: string) {
    const userPass = getUserPass(email);

    if (
      userPass?.status === "active" &&
      userPass.expires_at &&
      new Date(userPass.expires_at) > new Date()
    ) {
      return "active";
    }

    if (userPass?.status === "pending_verification") return "pending";
    if (userPass?.status === "rejected") return "rejected";

    return "none";
  }

  function statusLabel(status: string) {
    if (status === "active") return "Active";
    if (status === "pending") return "Pending";
    if (status === "rejected") return "Rejected";
    return "No Pass";
  }

  function statusClass(status: string) {
    if (status === "active") return "bg-green-100 text-green-700";
    if (status === "pending") return "bg-yellow-100 text-yellow-700";
    if (status === "rejected") return "bg-red-100 text-red-700";
    return "bg-neutral-100 text-neutral-600";
  }

  const filteredUsers = useMemo(() => {
    const term = search.toLowerCase();

    return profiles.filter((user) => {
      const status = passStatus(user.email);

      const fullText =
        `${user.first_name} ${user.last_name} ${user.username} ${user.email} ${user.phone}`.toLowerCase();

      const matchesSearch = fullText.includes(term);
      const matchesFilter = filter ? status === filter : true;

      return matchesSearch && matchesFilter;
    });
  }, [profiles, passes, search, filter]);

  const activeUsers = profiles.filter(
    (user) => passStatus(user.email) === "active"
  ).length;

  const pendingUsers = profiles.filter(
    (user) => passStatus(user.email) === "pending"
  ).length;

  const rejectedUsers = profiles.filter(
    (user) => passStatus(user.email) === "rejected"
  ).length;

  const noPassUsers = profiles.filter(
    (user) => passStatus(user.email) === "none"
  ).length;

  return (
    <main className="space-y-8">
      <section className="rounded-[32px] bg-black p-8 text-white shadow-xl">
        <p className="text-sm font-black uppercase tracking-[0.3em] text-yellow-400">
          RentDirect Admin
        </p>

        <h1 className="mt-3 text-4xl font-black">Users</h1>

        <p className="mt-3 max-w-2xl text-neutral-300">
          View registered users, contact details, usernames and inspection pass status.
        </p>
      </section>

      {message && (
        <div className="rounded-2xl bg-yellow-100 p-4 text-center font-black text-yellow-700">
          {message}
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-5">
        <StatCard title="Total Users" value={profiles.length} />
        <StatCard title="Active Passes" value={activeUsers} />
        <StatCard title="Pending Payments" value={pendingUsers} />
        <StatCard title="Rejected" value={rejectedUsers} />
        <StatCard title="No Pass" value={noPassUsers} />
      </section>

      <section className="rounded-[32px] bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-black">Registered Users</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Showing {filteredUsers.length} of {profiles.length} users
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, email, phone..."
              className="w-full rounded-full border border-neutral-200 px-5 py-3 outline-none md:w-80"
            />

            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-full border border-neutral-200 px-5 py-3 outline-none"
            >
              <option value="">All Users</option>
              <option value="active">Active Pass</option>
              <option value="pending">Pending Payment</option>
              <option value="rejected">Rejected</option>
              <option value="none">No Pass</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="py-12 text-center text-neutral-500">Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p className="py-12 text-center text-neutral-500">No users found.</p>
        ) : (
          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left">
              <thead>
                <tr className="border-b text-sm text-neutral-500">
                  <th className="pb-4">User</th>
                  <th className="pb-4">Username</th>
                  <th className="pb-4">Email</th>
                  <th className="pb-4">Phone</th>
                  <th className="pb-4">Pass Status</th>
                  <th className="pb-4">Joined</th>
                  <th className="pb-4">Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((user) => {
                  const status = passStatus(user.email);
                  const userPass = getUserPass(user.email);

                  return (
                    <tr key={user.id} className="border-b">
                      <td className="py-4">
                        <p className="font-black">
                          {user.first_name || "No first name"} {user.last_name || ""}
                        </p>
                      </td>

                      <td className="py-4 text-neutral-600">
                        {user.username || "Not added"}
                      </td>

                      <td className="py-4 text-neutral-600">
                        {user.email || "Not added"}
                      </td>

                      <td className="py-4 font-bold text-neutral-700">
                        {user.phone || "Not added"}
                      </td>

                      <td className="py-4">
                        <span
                          className={`rounded-full px-3 py-1 text-sm font-black ${statusClass(
                            status
                          )}`}
                        >
                          {statusLabel(status)}
                        </span>

                        {userPass?.expires_at && status === "active" && (
                          <p className="mt-2 text-xs text-neutral-500">
                            Expires:{" "}
                            {new Date(userPass.expires_at).toLocaleDateString()}
                          </p>
                        )}
                      </td>

                      <td className="py-4 text-sm text-neutral-500">
                        {user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "-"}
                      </td>

                      <td className="py-4">
                        <Link
                          href="/admin/payments"
                          className="rounded-full bg-black px-4 py-2 text-sm font-black text-white hover:bg-neutral-800"
                        >
                          View Payments
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-[28px] bg-white p-5 shadow-sm">
      <p className="text-sm font-bold text-neutral-500">{title}</p>
      <h2 className="mt-2 text-3xl font-black">{value}</h2>
    </div>
  );
}