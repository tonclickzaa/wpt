// META: title=Synchronous NativeIO API: File renaming is reflected in listing.
// META: global=dedicatedworker

'use strict';

test(testCase => {
  const file = nativeIO.openSync('test_file');
  testCase.add_cleanup(() => {
    file.close();
    nativeIO.deleteSync('test_file');
    nativeIO.deleteSync('new_name');
  });
  file.close();

  const fileNamesBeforeRename = nativeIO.getAllSync();
  assert_in_array('test_file', fileNamesBeforeRename);

  nativeIO.renameSync('test_file', 'new_name');
  const fileNamesAfterRename = nativeIO.getAllSync();
  assert_equals(fileNamesAfterRename.indexOf('test_file'), -1);
  assert_in_array('new_name', fileNamesAfterRename);
}, 'nativeIO.getAllSync returns a file renamed by nativeIOFileSync.rename with its new name.');

test(testCase => {
  const file1 = nativeIO.openSync('test_file_1');
  const file2 = nativeIO.openSync('test_file_2');
  testCase.add_cleanup(() => {
    file1.close();
    file2.close();
  });

  const writtenBytes1 = Uint8Array.from([64, 65, 66, 67]);
  file1.write(writtenBytes1, 0);
  const writtenBytes2 = Uint8Array.from([22, 23, 24, 25]);
  file2.write(writtenBytes2, 0);

  file1.close();
  file2.close();

  assert_throws_dom("InvalidStateError", () => nativeIO.renameSync('test_file_1', 'test_file_2'));

  const fileNamesAfterRename = nativeIO.getAllSync();
  assert_in_array('test_file_1', fileNamesAfterRename);
  assert_in_array('test_file_2', fileNamesAfterRename);

  // Make sure that a failed rename does not modify file contents.
  const file1_after = nativeIO.openSync('test_file_1');
  const file2_after = nativeIO.openSync('test_file_2');

  testCase.add_cleanup(() => {
    file1_after.close();
    file2_after.close();
    nativeIO.deleteSync('test_file_1');
    nativeIO.deleteSync('test_file_2');
  });
  const readBytes1 = new Uint8Array(writtenBytes1.length);
  file1_after.read(readBytes1, 0);
  assert_array_equals(readBytes1, writtenBytes1,
                      'the bytes read should match the bytes written');
  const readBytes2 = new Uint8Array(writtenBytes2.length);
  file2_after.read(readBytes2, 0);
  assert_array_equals(readBytes2, writtenBytes2,
                      'the bytes read should match the bytes written');
}, 'nativeIOFileSync.rename does not overwrite an existing file.');

test(testCase => {
  const file = nativeIO.openSync('test_file');
  testCase.add_cleanup(() => {
    file.close();
    nativeIO.deleteSync('test_file');
  });
  assert_throws_dom("InvalidStateError", () => nativeIO.renameSync('test_file', 'new_name'));
  file.close();

  const fileNamesAfterRename = nativeIO.getAllSync();
  assert_equals(fileNamesAfterRename.indexOf('new_name'), -1);
  assert_in_array('test_file', fileNamesAfterRename);
}, 'nativeIOFileSync.rename does not allow renaming an open file.');


test(testCase => {
  const names = ["a/b", "a.b", "a\\b", "a:b"];

  testCase.add_cleanup(() => {
    file.close();
    nativeIO.deleteSync('test_file');
    for (let name of nativeIO.getAllSync()) {
      nativeIO.deleteSync(name);
    }
  });

  const file = nativeIO.openSync('test_file');
  file.close();
  for (let name of names) {
    assert_throws_dom("InvalidCharacterError", () => nativeIO.renameSync('test_file', name));
  }
}, 'nativeIOFileSync.rename does not allow renaming to invalid names.');
