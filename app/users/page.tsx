import { Separator } from "@/components/ui/separator";
import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";
import UserCard from "./user-card";

export default async function UsersList() {
  // Create supabase server component client and obtain user session from stored cookie
  const supabase = createServerSupabaseClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    // this is a protected route - only users who are signed in can view this route
    redirect("/");
  }

  const { data: profiles } = await supabase.from("profiles").select("*").order("id", { ascending: false });
  return (
    <>
      <Separator className="my-4" />
      <div className="profile-list">
        {/* Render profiles if available */}
        {profiles?.length ? ( // If profiles has a defined and positive length, display all profiles as cards
          <div className="flex flex-wrap justify-center">
            {profiles?.map((profile) => <UserCard key={profile.id} profile={profile} />)}
          </div>
        ) : (
          // If profiles is undefined or <1 length
          <p>No profiles found.</p>
        )}
      </div>
    </>
  );
}
