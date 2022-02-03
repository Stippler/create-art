from setuptools import setup, find_packages

setup(
    name='create-art',
    version='1.0.0',
    packages=find_packages(include=['art', 'art.*', 'torch_utils.*', 'dnnlib.*'])
)

