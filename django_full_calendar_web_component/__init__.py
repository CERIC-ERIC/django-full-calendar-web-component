from importlib.metadata import PackageNotFoundError, version

try:
    __version__ = version("django-full-calendar-web-component")
except PackageNotFoundError:
    # Fallback when package is not installed via package manager
    __version__ = "1.0.0"

__all__ = ["__version__"]
