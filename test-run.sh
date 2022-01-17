a=$PWD/example/program-keypair.json
b=$PWD/example/target/deploy/example-keypair.json

mkdir -p $PWD/example/target/deploy/
rm -rf $PWD/example/data
mkdir -p $PWD/example/data
cd example
ln -sf $a $b
anchor test