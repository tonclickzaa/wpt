// META: title=NativeIO API: Assigned length is observed back.
// META: global=window,worker

'use strict';

promise_test(async testCase => {
  const file = await nativeIO.open('test_file');
  testCase.add_cleanup(async () => {
    await file.close();
    await nativeIO.delete('test_file');
  });

  const writeSharedArrayBuffer = new SharedArrayBuffer(10);
  const writtenBytes = new Uint8Array(writeSharedArrayBuffer);
  writtenBytes.set([10, 11, 12, 13, 14, 15, 16, 17, 18, 19]);
  await file.write(writtenBytes, 0);

  await file.setLength(5);

  const lengthDecreased = await file.getLength();
  assert_equals(
      lengthDecreased, 5,
      'NativeIOFile.getLength() should resolve with the number of bytes in the file after decreasing the length');

  const remainingBytes = Uint8Array.from([10, 11, 12, 13, 14]);
  const readSharedArrayBuffer = new SharedArrayBuffer(remainingBytes.length);
  const readBytes = new Uint8Array(readSharedArrayBuffer);
  await file.read(readBytes, 0);

  assert_array_equals(
      readBytes, remainingBytes,
      'NativeIOFile.setLength() should shrink the file from its end');
}, 'NativeIOFile.setLength shrinks a file, NativeIOFile.getLength reports new length');

promise_test(async testCase => {
  const file = await nativeIO.open('test_file');
  testCase.add_cleanup(async () => {
    await file.close();
    await nativeIO.delete('test_file');
  });

  const writeSharedArrayBuffer = new SharedArrayBuffer(3);
  const writtenBytes = new Uint8Array(writeSharedArrayBuffer);
  writtenBytes.set([10, 11, 12]);
  await file.write(writtenBytes, 0);

  await file.setLength(5);

  const lengthIncreased = await file.getLength();
  assert_equals(
      lengthIncreased, 5,
      'NativeIOFile.getLength() should resolve with the number of bytes in the file after increasing the length');

  const expectedBytes = Uint8Array.from([10, 11, 12, 0, 0]);
  const readSharedArrayBuffer = new SharedArrayBuffer(expectedBytes.length);
  const readBytes = new Uint8Array(readSharedArrayBuffer);
  await file.read(readBytes, 0);

  assert_array_equals(
      readBytes, expectedBytes,
      'NativeIOFile.setLength() should append zeros when enlarging the file');
}, 'NativeIOFile.setLength appends zeros to a file, NativeIOFile.getLength reports new length');
