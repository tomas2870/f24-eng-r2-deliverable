import { Separator } from "@/components/ui/separator";
import { createServerSupabaseClient } from "@/lib/server-utils";
import { redirect } from "next/navigation";
// import AddSpeciesDialog from "./add-species-dialog";
// import SpeciesCard from "./species-card";

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

  // Obtain the ID of the currently signed-in user
  const sessionId = session.user.id;

  const { data: profiles } = await supabase.from("profiles").select("*").order("id", { ascending: false });
  return (
    <>
      <Separator className="my-4" />
      <div className="profile-list">
        {/* Render profiles if available */}
        {profiles?.length > 0 ? (
          profiles.map((profile) => (
            <div key={profile.id} className="profile-card">
              {/* Display all relevant profile data */}
              <p>
                <strong>Name:</strong> {profile.display_name}
              </p>
              <p>
                <strong>Email:</strong> {profile.email}
              </p>
              <p>
                <strong>Bio:</strong> {profile.biography}
              </p>
              {/* Add more fields as needed */}
            </div>
          ))
        ) : (
          <p>No profiles found.</p>
        )}
      </div>
    </>
  );
}
