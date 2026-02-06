import setuptools
from pathlib import Path

# Read README from docs directory or use a simple description
readme_path = Path(__file__).parent.parent / "docs" / "README.md"
if readme_path.exists():
    long_description = readme_path.read_text(encoding="utf-8")
else:
    long_description = "Türkçe metin analizi ve PDF işleme backend servisi."

REQUIREMENTS = [
    "fastapi>=0.100.0",
    "uvicorn>=0.23.0",
    "pydantic>=2.0.0",
    "python-dotenv>=1.0.0",
    "httpx>=0.25.0",
    "aiofiles>=23.0.0",
    "cachetools>=5.3.0",
    "python-multipart>=0.0.6",
    "reportlab>=4.0.0",
    "pdf2docx>=0.5.6",
    "pypdf>=4.0.0",
]

CLASSIFIERS = [
    "Development Status :: 4 - Beta",
    "Intended Audience :: Developers",
    "Programming Language :: Python :: 3",
    "Programming Language :: Python :: 3.10",
    "Programming Language :: Python :: 3.11",
    "Programming Language :: Python :: 3.12",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
    "Framework :: FastAPI",
    "Topic :: Text Processing :: Linguistic",
]

setuptools.setup(
    name="metinanaliz",
    version="1.2.0",
    description="Türkçe Metin Analizi ve PDF İşleme Backend",
    long_description=long_description,
    long_description_content_type="text/markdown",
    url="https://github.com/karanba/MetinAnaliz",
    author="Altay Karakuş",
    author_email="altaykarakus@gmail.com",
    license="MIT",
    packages=setuptools.find_packages(exclude=["tests", "tests.*"]),
    package_data={
        "": ["fonts/*.ttf", "fonts/*.LICENSE", "examples/*"],
    },
    include_package_data=True,
    install_requires=REQUIREMENTS,
    classifiers=CLASSIFIERS,
    python_requires=">=3.10",
    keywords="analiz, metin, türkçe, nlp, pdf, fastapi",
    entry_points={
        "console_scripts": [
            "metinanaliz=cli.analiz:main",
        ],
    },
)
