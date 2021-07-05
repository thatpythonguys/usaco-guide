import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import { PostData } from '../../../models/groups/posts';
import { ProblemData } from '../../../models/groups/problem';

interface updateGroupMdxDocumentArgs {
  groupId: string;
  postId: string;
  problemId?: string;
  updatedData: Partial<PostData> | Partial<ProblemData>;
}

if (admin.apps.length === 0) {
  admin.initializeApp();
}

let compileXdm = null;

export default functions.https.onCall(
  async (
    { groupId, postId, problemId, updatedData }: updateGroupMdxDocumentArgs,
    context
  ) => {
    if (compileXdm === null) {
      compileXdm = await require('../xdmCompiler').compileXdm;
    }
    const callerUid = context.auth?.uid;
    const canCreateMdxPosts = context.auth?.token?.canCreateMdxPosts;

    if (!canCreateMdxPosts) {
      return {
        success: false,
        errorCode: 'NOT_AUTHORIZED_MDX',
        message: "You aren't authorized to create MDX posts.",
      };
    }

    const groupData = await admin
      .firestore()
      .collection('groups')
      .doc(groupId)
      .get()
      .then(snapshot => snapshot.data());
    if (!groupData) {
      return {
        success: false,
        errorCode: 'GROUP_NOT_FOUND',
        message:
          'We were unable to find the requested group. It may have been deleted.',
      };
    } else if (
      groupData.adminIds.includes(callerUid) ||
      groupData.ownerIds.includes(callerUid)
    ) {
      return {
        success: false,
        errorCode: 'NOT_AUTHORIZED_GROUP',
        message: "You don't have permissions to modify posts for this group.",
      };
    }

    if (updatedData.isMdx) {
      try {
        updatedData.mdxBody = await compileXdm(updatedData.mdxSource);
      } catch (e) {
        return {
          succes: false,
          errorCode: 'FAILED_TO_COMPILE',
          message: 'Failed to compile MDX.',
        };
      }
    }

    await admin
      .firestore()
      .collection('groups')
      .doc(groupId)
      .collection('posts')
      .doc(postId)
      .update(updatedData);

    return { success: true };
  }
);
