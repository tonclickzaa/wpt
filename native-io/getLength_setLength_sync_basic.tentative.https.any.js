// META: title=Synchronous NativeIO API: Getting and setting lengths.
// META: global=dedicatedworker

'use strict';

test(testCase => {
  const file = nativeIO.openSync('test_file');
  testCase.add_cleanup(() => {
    file.close();
    nativeIO.deleteSync('test_file');
  });

  const writtenBytes =
      Uint8Array.from([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  file.write(writtenBytes, 0);
  const remainingBytes = Uint8Array.from([10, 11, 12, 13, 14]);
  const readBytes = new Uint8Array(remainingBytes.length);

  file.setLength(5);
  const lengthDecreased = file.getLength();
  assert_equals(
      lengthDecreased, 5,
      'NativeIOFileSync.getLength() should shrink the file from its end');
  file.read(readBytes, 0);

  assert_array_equals(
      readBytes, remainingBytes,
      'NativeIOFileSync.setLength() should shrink the file from its end');
}, 'NativeIOFileSync.setLength shrinks a file, NativeIOFileSync.getLength reports new length');

test(testCase => {
  const file = nativeIO.openSync('test_file');
  testCase.add_cleanup(() => {
    file.close();
    nativeIO.deleteSync('test_file');
  });

  const writtenBytes = Uint8Array.from([10, 11, 12]);
  file.write(writtenBytes, 0);
  const expectedBytes = Uint8Array.from([10, 11, 12, 0, 0]);
  const readBytes = new Uint8Array(expectedBytes.length);

  file.setLength(5);
  const lengthIncreased = file.getLength();
  assert_equals(
      lengthIncreased, 5,
      'NativeIOFileSync.getLength() should resolve with the number of bytes in the file after increasing the length');
  file.read(readBytes, 0);

  assert_array_equals(
      readBytes, expectedBytes,
      'NativeIOFileSync.setLength() should append zeros when enlarging the file');
}, 'NativeIOFileSync.setLength appends zeros to a file, NativeIOFileSync.getLength reports new length');
