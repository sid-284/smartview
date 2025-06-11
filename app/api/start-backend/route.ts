import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs';
import { spawn } from 'child_process';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { join } from 'path';

const PID_FILE = join(process.cwd(), '.backend.pid');

function savePid(pid: number) {
  writeFileSync(PID_FILE, pid.toString());
}

function getPid(): number | null {
  if (!existsSync(PID_FILE)) return null;
  const pid = parseInt(readFileSync(PID_FILE, 'utf-8'));
  return isNaN(pid) ? null : pid;
}

function isProcessRunning(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

export async function POST() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if backend is already running
    const existingPid = getPid();
    if (existingPid && isProcessRunning(existingPid)) {
      return NextResponse.json({ 
        message: 'Backend is already running',
        pid: existingPid
      });
    }

    // Start the Python backend
    const pythonProcess = spawn('python3', ['/Users/sidharthmohan/Desktop/projects/apra/app.py'], {
      detached: true,
      stdio: 'ignore'
    });

    // Save the PID
    savePid(pythonProcess.pid);

    // Unref the process to allow it to run independently
    pythonProcess.unref();

    return NextResponse.json({ 
      message: 'Backend started successfully',
      pid: pythonProcess.pid
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { userId } = auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const pid = getPid();
    if (!pid) {
      return NextResponse.json({ message: 'No backend process found' });
    }

    if (isProcessRunning(pid)) {
      process.kill(pid);
    }

    // Remove PID file
    if (existsSync(PID_FILE)) {
      require('fs').unlinkSync(PID_FILE);
    }

    return NextResponse.json({ message: 'Backend stopped successfully' });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 