import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getNextConsecutiveNumber, generateProjectCode } from '@/lib/project-codes';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectType, verticalProject, prototipo } = body;

    if (!projectType) {
      return NextResponse.json(
        { error: 'Project type is required' },
        { status: 400 }
      );
    }

    // Create Supabase client
    const supabase = await createServerSupabaseClient();

    // Get current date
    const currentDate = new Date();

    // Get the next consecutive number for this month
    const consecutiveNumber = await getNextConsecutiveNumber(
      projectType,
      verticalProject || null,
      currentDate,
      supabase
    );

    // Determine project type for code generation
    let codeProjectType: 'residencial' | 'vertical';
    if (projectType === '1') { // Residencial
      codeProjectType = 'residencial';
    } else if (projectType === '3') { // Desarrollo (vertical)
      codeProjectType = 'vertical';
    } else {
      return NextResponse.json(
        { error: 'Unsupported project type for code generation' },
        { status: 400 }
      );
    }

    // Generate the project code
    const projectCode = generateProjectCode({
      projectType: codeProjectType,
      verticalProject: verticalProject || 'WN', // Default to WN for now
      date: currentDate,
      consecutiveNumber,
      prototipo: prototipo || undefined
    });

    return NextResponse.json({
      projectCode,
      consecutiveNumber,
      year: currentDate.getFullYear(),
      month: currentDate.getMonth() + 1
    });

  } catch (error) {
    console.error('Error generating project code:', error);
    return NextResponse.json(
      { error: 'Failed to generate project code' },
      { status: 500 }
    );
  }
} 