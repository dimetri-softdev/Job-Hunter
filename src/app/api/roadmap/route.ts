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

// GET: Load all roadmaps for the logged-in user
export async function GET() {
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

    const { data: roadmaps, error } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const formattedRoadmaps = (roadmaps || []).map((r) => ({
      id: r.id,
      title: r.title,
      readinessScore: r.readiness_score,
      projects: r.projects || [],
      createdAt: r.created_at,
    }));

    return NextResponse.json({
      success: true,
      roadmaps: formattedRoadmaps,
    });
  } catch (error: any) {
    console.error("GET /api/roadmap error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch roadmaps" },
      { status: 500 }
    );
  }
}

// POST: Create and persist a new roadmap
export async function POST(request: Request) {
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

    const body = await request.json();
    const { targetRole, currentSkills } = body;

    const newRoadmapData = {
      title: targetRole || "Full-Stack Developer",
      readiness_score: 75,
      projects: [
        {
          id: `proj-1`,
          title: `Core ${targetRole || "Developer"} Foundations`,
          description: `Customized roadmap track focusing on ${currentSkills || "Software Engineering"}.`,
          level: "Intermediate",
          tasks: [
            { id: "task-1", label: "Configure repository & build environment", completed: false },
            { id: "task-2", label: "Implement core backend API services", completed: false },
            { id: "task-3", label: "Deploy frontend client to Vercel", completed: false },
          ],
        },
      ],
    };

    const { data: insertedRoadmap, error } = await supabase
      .from("roadmaps")
      .insert({
        user_id: user.id,
        title: newRoadmapData.title,
        readiness_score: newRoadmapData.readiness_score,
        projects: newRoadmapData.projects,
      })
      .select()
      .single();

    if (error) throw error;

    const formattedRoadmap = {
      id: insertedRoadmap.id,
      title: insertedRoadmap.title,
      readinessScore: insertedRoadmap.readiness_score,
      projects: insertedRoadmap.projects || [],
      createdAt: insertedRoadmap.created_at,
    };

    return NextResponse.json({
      success: true,
      roadmap: formattedRoadmap,
    });
  } catch (error: any) {
    console.error("POST /api/roadmap error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to create roadmap" },
      { status: 500 }
    );
  }
}