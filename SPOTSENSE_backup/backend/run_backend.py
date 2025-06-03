import subprocess
import sys
import os
import time
import signal
import atexit
import psutil

# Store process objects
processes = []

def cleanup_processes():
    """Cleanup all running processes on exit"""
    print("\nShutting down services...")
    for p in processes:
        try:
            if p.poll() is None:  # If process is still running
                # Get process group
                group = psutil.Process(p.pid)
                # Kill process and its children
                for child in group.children(recursive=True):
                    child.kill()
                group.kill()
                print(f"Terminated process {p.pid}")
        except Exception as e:
            print(f"Error terminating process: {e}")

def start_service(script_name, description):
    """Start a Python service and return the process object"""
    script_path = os.path.join(os.path.dirname(__file__), script_name)
    print(f"\nStarting {description}...")
    try:
        # Start process in a new process group
        process = subprocess.Popen(
            [sys.executable, script_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            bufsize=1,
            universal_newlines=True,
            creationflags=subprocess.CREATE_NEW_PROCESS_GROUP
        )
        print(f"Started {description} (PID: {process.pid})")
        return process
    except Exception as e:
        print(f"Error starting {description}: {e}")
        return None

def monitor_processes():
    """Monitor running processes and their output"""
    while True:
        for p in processes[:]:  # Create a copy of the list to modify it safely
            # Check if process has terminated
            if p.poll() is not None:
                print(f"\nProcess {p.pid} terminated with code {p.returncode}")
                processes.remove(p)
                continue

            # Read output without blocking
            try:
                stdout = p.stdout.readline()
                if stdout:
                    print(f"[PID {p.pid}] {stdout.strip()}")
                stderr = p.stderr.readline()
                if stderr:
                    print(f"[PID {p.pid} ERROR] {stderr.strip()}")
            except Exception as e:
                print(f"Error reading process output: {e}")

        # Break if all processes have terminated
        if not processes:
            print("\nAll services have terminated.")
            break

        time.sleep(0.1)

def main():
    """Main function to start and manage all services"""
    print("Starting Smart Parking Backend Services")
    print("======================================")
    
    # Register cleanup function
    atexit.register(cleanup_processes)
    
    # Start REST API server
    api_process = start_service("app.py", "REST API Server")
    if api_process:
        processes.append(api_process)
        # Wait for API server to start
        time.sleep(2)
    
    # Start WebSocket server
    ws_process = start_service("websocket_server.py", "WebSocket Server")
    if ws_process:
        processes.append(ws_process)
        # Wait for WebSocket server to start
        time.sleep(2)
    
    # Start main detection system
    main_process = start_service("main.py", "Parking Detection System")
    if main_process:
        processes.append(main_process)
    
    if not processes:
        print("Failed to start any services.")
        return
    
    print("\nAll services started successfully!")
    print("Press Ctrl+C to stop all services")
    
    try:
        # Monitor process output
        monitor_processes()
    except KeyboardInterrupt:
        print("\nReceived shutdown signal...")
    finally:
        cleanup_processes()

if __name__ == "__main__":
    main() 