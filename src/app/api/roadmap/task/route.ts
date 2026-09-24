import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function getSupabaseClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Guard for context calls
          }
        },
      },
    }
  );
}

// PATCH: Toggle task completion state inside JSONB projects column
export async function PATCH(request: Request) {
  try {
    const supabase = await getSupabaseClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { roadmapId, taskId, completed } = await request.json();

    if (!roadmapId || !taskId || typeof completed !== "boolean") {
      return NextResponse.json(
        { success: false, error: "Missing required fields: roadmapId, taskId, completed" },
        { status: 400 }
      );
    }

    // Fetch current JSON structure
    const { data: roadmap, error: fetchError } = await supabase
      .from("roadmaps")
      .select("projects")
      .eq("id", roadmapId)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !roadmap) {
      return NextResponse.json(
        { success: false, error: "Roadmap not found" },
        { status: 404 }
      );
    }

    // Mutate the specific task status
    const updatedProjects = (roadmap.projects || []).map((project: any) => ({
      ...project,
      tasks: (project.tasks || []).map((task: any) =>
        task.id === taskId ? { ...task, completed } : task
      ),
    }));

    // Update in Supabase
    const { data: updatedRoadmap, error: updateError } = await supabase
      .from("roadmaps")
      .update({ projects: updatedProjects })
      .eq("id", roadmapId)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json({
      success: true,
      roadmap: {
        id: updatedRoadmap.id,
        title: updatedRoadmap.title,
        readinessScore: updatedRoadmap.readiness_score,
        projects: updatedRoadmap.projects,
        createdAt: updatedRoadmap.created_at,
      },
    });
  } catch (error: any) {
    console.error("PATCH /api/roadmap/task error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update task state" },
      { status: 500 }
    );
  }
}