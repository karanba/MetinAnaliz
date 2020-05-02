import setuptools

with open("README.md", "r") as fh:
    long_description = fh.read()

REQUIREMENTS = ['re']

CLASSIFIERS = [
    "Programming Language :: Python :: 3",
    "License :: OSI Approved :: MIT License",
    "Operating System :: OS Independent",
]

setuptools.setup(name='metinanaliz', 
    version='1.1.6', 
    description='Türkçe Metin Analizi', 
    long_description=long_description, 
    long_description_content_type="text/markdown",
    url='https://github.com/karanba/MetinAnaliz', 
    author='Altay Karakuş', 
    author_email='altaykarakus@gmail.com', 
    license='MIT', 
    packages= setuptools.find_packages(),
    classifiers=CLASSIFIERS, 
    python_requires='>=3.6', 
    keywords='analiz, metin, türkçe'
) 