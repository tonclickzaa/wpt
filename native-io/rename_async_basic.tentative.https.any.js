// META: title=NativeIO API: File renaming is reflected in listing.
// META: global=window,worker

'use strict';

promise_test(async testCase => {
  const file = await nativeIO.open('test_file');
  testCase.add_cleanup(async () => {
    await nativeIO.delete('test_file');
    await nativeIO.delete('new_name');
  });
  await file.close();

  const fileNamesBeforeRename = await nativeIO.getAll();
  assert_in_array('test_file', fileNamesBeforeRename);

  await nativeIO.rename('test_file', 'new_name');
  const fileNamesAfterRename = await nativeIO.getAll();
  assert_false(fileNamesAfterRename.includes('test_file'));
  assert_in_array('new_name', fileNamesAfterRename);
}, 'nativeIO.getAll returns a file renamed by nativeIOFile.rename with its new name.');

promise_test(async testCase => {
  const file1 = await nativeIO.open('test_file_1');
  const file2 = await nativeIO.open('test_file_2');
  testCase.add_cleanup(async () => {
    await file1.close();
    await file2.close();
  });

  const writeSharedArrayBuffer1 = new SharedArrayBuffer(4);
  const writtenBytes1 = new Uint8Array(writeSharedArrayBuffer1);
  writtenBytes1.set([64, 65, 66, 67]);
  const writeSharedArrayBuffer2 = new SharedArrayBuffer(4);
  const writtenBytes2 = new Uint8Array(writeSharedArrayBuffer2);
  writtenBytes2.set([24, 25, 22, 27]);

  await file1.write(writtenBytes1, 0);
  await file2.write(writtenBytes2, 0);
  await file1.close();
  await file2.close();

  promise_rejects_dom(testCase, "InvalidStateError", nativeIO.rename('test_file_1', 'test_file_2'));

  const fileNamesAfterRename = await nativeIO.getAll();
  assert_in_array('test_file_1', fileNamesAfterRename);
  assert_in_array('test_file_2', fileNamesAfterRename);

  // Make sure that a failed rename does not modify file contents.
  const file1_after = await nativeIO.open('test_file_1');
  const file2_after = await nativeIO.open('test_file_2');

  testCase.add_cleanup(async () => {
    await file1_after.close();
    await file2_after.close();
    await nativeIO.delete('test_file_1');
    await nativeIO.delete('test_file_2');
  });

  const readSharedArrayBuffer1 = new SharedArrayBuffer(writtenBytes1.length);
  const readBytes1 = new Uint8Array(readSharedArrayBuffer1);
  await file1_after.read(readBytes1, 0);
  const readSharedArrayBuffer2 = new SharedArrayBuffer(writtenBytes2.length);
  const readBytes2 = new Uint8Array(readSharedArrayBuffer2);
  await file2_after.read(readBytes2, 0);
  assert_array_equals(readBytes1, writtenBytes1,
                      'the bytes read should match the bytes written');
  assert_array_equals(readBytes2, writtenBytes2,
                     'the bytes read should match the bytes written');
}, 'nativeIOFile.rename does not overwrite an existing file.');

promise_test(async testCase => {
  const file = await nativeIO.open('test_file');
  testCase.add_cleanup(async () => {
    await file.close();
    await nativeIO.delete('test_file');
  });
  promise_rejects_dom(testCase, "InvalidStateError", nativeIO.rename('test_file', 'new_name'));
  await file.close();

  const fileNamesAfterRename = await nativeIO.getAll();
  assert_false(fileNamesAfterRename.includes('new_name'));
  assert_in_array('test_file', fileNamesAfterRename);
}, 'nativeIOFile.rename does not allow renaming an open file.');

promise_test(async testCase => {
  const names = ["a/b", "a.b", "a\\b", "a:b"];

  testCase.add_cleanup(async () => {
    await file.close();
    await nativeIO.delete('test_file');
    for (let name of await nativeIO.getAll()) {
      await nativeIO.delete(name);
    }
  });

  const file = await nativeIO.open('test_file');
  await file.close();
  for (let name of names) {
    promise_rejects_dom(testCase, "InvalidCharacterError", nativeIO.rename('test_file', name));
  }
}, 'nativeIOFile.rename does not allow renaming to invalid names.');
