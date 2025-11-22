#!/usr/bin/env python3
"""
Prerequisites Verification Script
Checks system requirements before running the application
"""

import sys
import subprocess
import platform
from typing import Tuple, List, Dict
import importlib.util


class Colors:
    """ANSI color codes for terminal output"""
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    RESET = '\033[0m'
    BOLD = '\033[1m'


class PrerequisitesChecker:
    """Comprehensive system prerequisites checker"""
    
    def __init__(self):
        self.results: List[Dict[str, any]] = []
        self.errors: List[str] = []
        self.warnings: List[str] = []
    
    def check_python_version(self) -> Tuple[bool, str]:
        """Verify Python version is 3.10.x"""
        version = sys.version_info
        current_version = f"{version.major}.{version.minor}.{version.micro}"
        
        if version.major == 3 and version.minor == 10:
            return True, f"Python {current_version} ✓"
        elif version.major == 3 and version.minor > 10:
            self.warnings.append(f"Python {current_version} detected. Recommended: 3.10.x")
            return True, f"Python {current_version} (⚠️  Newer than 3.10)"
        else:
            return False, f"Python {current_version} (✗ Required: 3.10.x)"
    
    def check_java(self) -> Tuple[bool, str]:
        """Check Java installation (required for PySpark)"""
        try:
            result = subprocess.run(
                ['java', '-version'],
                capture_output=True,
                text=True,
                timeout=5
            )
            
            # Java version is in stderr
            version_output = result.stderr.split('\n')[0]
            
            if 'version' in version_output.lower():
                return True, f"Java installed ✓ ({version_output.split('\"')[1]})"
            else:
                return False, "Java not properly configured"
                
        except FileNotFoundError:
            return False, "Java not found (✗ Required for PySpark)"
        except subprocess.TimeoutExpired:
            return False, "Java check timed out"
        except Exception as e:
            return False, f"Java check failed: {str(e)}"
    
    def check_package_installed(self, package_name: str) -> Tuple[bool, str]:
        """Check if a Python package is installed"""
        spec = importlib.util.find_spec(package_name)
        if spec is not None:
            try:
                module = importlib.import_module(package_name)
                version = getattr(module, '__version__', 'unknown')
                return True, f"{package_name} {version} ✓"
            except Exception:
                return True, f"{package_name} installed ✓"
        else:
            return False, f"{package_name} not installed ✗"
    
    def check_disk_space(self, path: str = '.', min_gb: float = 1.0) -> Tuple[bool, str]:
        """Check available disk space"""
        try:
            import shutil
            stat = shutil.disk_usage(path)
            free_gb = stat.free / (1024 ** 3)
            
            if free_gb >= min_gb:
                return True, f"Disk space: {free_gb:.2f} GB available ✓"
            else:
                return False, f"Disk space: {free_gb:.2f} GB (✗ Need {min_gb} GB)"
        except Exception as e:
            return False, f"Could not check disk space: {str(e)}"
    
    def check_memory(self, min_gb: float = 2.0) -> Tuple[bool, str]:
        """Check available RAM"""
        try:
            import psutil
            mem = psutil.virtual_memory()
            available_gb = mem.available / (1024 ** 3)
            total_gb = mem.total / (1024 ** 3)
            
            if available_gb >= min_gb:
                return True, f"RAM: {available_gb:.2f}/{total_gb:.2f} GB available ✓"
            else:
                self.warnings.append(f"Low memory: {available_gb:.2f} GB available")
                return True, f"RAM: {available_gb:.2f}/{total_gb:.2f} GB (⚠️  Low)"
        except ImportError:
            return True, "RAM check skipped (psutil not installed)"
        except Exception as e:
            return True, f"RAM check failed: {str(e)}"
    
    def run_all_checks(self) -> bool:
        """Run all prerequisite checks"""
        print(f"\n{Colors.BOLD}{Colors.BLUE}=== Document Similarity Checker - Prerequisites Check ==={Colors.RESET}\n")
        
        checks = [
            ("Python Version", self.check_python_version()),
            ("Java Runtime", self.check_java()),
            ("Disk Space", self.check_disk_space()),
            ("Memory", self.check_memory()),
        ]
        
        # Check critical packages
        critical_packages = ['pyspark', 'fastapi', 'numpy', 'pandas']
        for package in critical_packages:
            checks.append((f"Package: {package}", self.check_package_installed(package)))
        
        # Display results
        all_passed = True
        for check_name, (passed, message) in checks:
            status_color = Colors.GREEN if passed else Colors.RED
            print(f"{check_name:20} {status_color}{message}{Colors.RESET}")
            
            if not passed:
                all_passed = False
                self.errors.append(f"{check_name}: {message}")
        
        # Display warnings
        if self.warnings:
            print(f"\n{Colors.YELLOW}{Colors.BOLD}Warnings:{Colors.RESET}")
            for warning in self.warnings:
                print(f"{Colors.YELLOW}⚠️  {warning}{Colors.RESET}")
        
        # Display errors
        if self.errors:
            print(f"\n{Colors.RED}{Colors.BOLD}Errors:{Colors.RESET}")
            for error in self.errors:
                print(f"{Colors.RED}✗ {error}{Colors.RESET}")
        
        # System info
        print(f"\n{Colors.BLUE}System Information:{Colors.RESET}")
        print(f"OS: {platform.system()} {platform.release()}")
        print(f"Architecture: {platform.machine()}")
        print(f"Python: {sys.version.split()[0]}")
        
        # Final verdict
        print(f"\n{Colors.BOLD}{'='*60}{Colors.RESET}")
        if all_passed:
            print(f"{Colors.GREEN}{Colors.BOLD}✓ All prerequisites met! Ready to proceed.{Colors.RESET}")
        else:
            print(f"{Colors.RED}{Colors.BOLD}✗ Prerequisites check failed. Please fix the errors above.{Colors.RESET}")
            print(f"\n{Colors.YELLOW}Installation help:{Colors.RESET}")
            print("1. Install missing packages: pip install -r requirements.txt")
            print("2. Install Java: https://adoptium.net/")
            print("3. Ensure Python 3.10.x is installed")
        
        print(f"{Colors.BOLD}{'='*60}{Colors.RESET}\n")
        
        return all_passed


def main():
    """Main entry point"""
    checker = PrerequisitesChecker()
    success = checker.run_all_checks()
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
