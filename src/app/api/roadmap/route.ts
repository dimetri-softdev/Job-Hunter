import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenAI, Type } from "@google/genai";
import { supabase } from "@/lib/supabase";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// GET: Fetch all saved roadmaps for the logged-in user
export async function GET() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("roadmaps")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return NextResponse.json({ roadmaps: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST: Generate AI roadmap AND save it to Supabase
export async function POST(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, targetRole, currentTechStack, resumeText } = body;

    if (!targetRole || !currentTechStack) {
      return NextResponse.json(
        { error: "Target role and current tech stack are required." },
        { status: 400 }
      );
    }

    const prompt = `
      Act as an expert technical career coach and hiring manager.
      Analyze the candidate profile and create a targeted project roadmap.
      
      Candidate Name: ${name || "Candidate"}
      Target Role: ${targetRole}
      Current Tech Stack: ${Array.isArray(currentTechStack) ? currentTechStack.join(", ") : currentTechStack}
      Resume/Background: ${resumeText || "None provided"}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            readinessScore: { type: Type.INTEGER },
            gapAnalysis: { type: Type.STRING },
            targetRole: { type: Type.STRING },
            projects: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  difficulty: { type: Type.STRING },
                  skillsTargeted: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                  },
                  steps: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        order: { type: Type.INTEGER },
                        title: { type: Type.STRING },
                        description: { type: Type.STRING },
                      },
                      required: ["order", "title", "description"],
                    },
                  },
                },
                required: ["title", "description", "difficulty", "skillsTargeted", "steps"],
              },
            },
          },
          required: ["readinessScore", "gapAnalysis", "targetRole", "projects"],
        },
      },
    });

    const roadmapData = JSON.parse(response.text!);

    // Save to Supabase
    const { data: savedRoadmap, error: dbError } = await supabase
      .from("roadmaps")
      .insert({
        user_id: userId,
        target_role: roadmapData.targetRole,
        current_tech_stack: currentTechStack,
        readiness_score: roadmapData.readinessScore,
        gap_analysis: roadmapData.gapAnalysis,
        projects: roadmapData.projects,
        completed_steps: {},
      })
      .select()
      .single();

    if (dbError) {
      console.error("Supabase Save Error:", dbError);
    }

    return NextResponse.json({ roadmap: savedRoadmap || roadmapData });
  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to generate roadmap via AI." },
      { status: 500 }
    );
  }
}

// PATCH: Update completed steps for a specific roadmap
export async function PATCH(request: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { roadmapId, completedSteps } = await request.json();

    const { data, error } = await supabase
      .from("roadmaps")
      .update({ completed_steps: completedSteps })
      .eq("id", roadmapId)
      .eq("user_id", userId)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ roadmap: data });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}