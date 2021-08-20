import {inject, service} from '@loopback/core';
import {repository} from '@loopback/repository';
import {del, get, param, put, requestBody} from '@loopback/rest';
import {
  CONTENT_TYPE,
  OPERATION_SECURITY_SPEC, STATUS_CODE
} from '@sourceloop/core';
import {authenticate, STRATEGY} from 'loopback4-authentication';
import {authorize} from 'loopback4-authorization';
import {PermissionKeys} from '../enums/permission-keys.enum';
import {VideoChatBindings} from '../keys';
import {AuditLogsRepository, VideoChatSessionRepository} from '../repositories';
import {ChatArchiveSession} from '../services/chatArchive.service';
import {ChatSessionService} from '../services/chatSession.service';
import {
  AzureTargetOptions, S3TargetOptions, VideoChatInterface
} from '../types';

export class VideoChatArchiveController {
  constructor(
    @inject(VideoChatBindings.VideoChatProvider)
    private readonly videoChatProvider: VideoChatInterface,
    @repository(VideoChatSessionRepository)
    private readonly videoChatSessionRepository: VideoChatSessionRepository,
    @repository(AuditLogsRepository)
    private readonly auditLogRepository: AuditLogsRepository,

   @service(ChatSessionService) public chatArchiveSession: ChatArchiveSession
  ) { }

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKeys.GetArchives]})
  @get('/archives/{archiveId}', {
    description:
      'Used to fetch a specific archive w.r.t archiveId. If archive is not present, it will throw HTTP Not Found Error.',
    security: OPERATION_SECURITY_SPEC,
    responses: {
      [STATUS_CODE.OK]: {
        content: {
          [CONTENT_TYPE.JSON]: {
            schema: {
              type: 'object',
            },
          },
        },
      },
    },
  })
  async getArchive(@param.path.string('archiveId') archiveId: string) {
    return await this.chatArchiveSession.getArchive(archiveId);
  }

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKeys.GetArchives]})
  @get('/archives', {
    description:
      'Used to fetch a list of archives (meetings that were recorded).',
    security: OPERATION_SECURITY_SPEC,
    responses: {
      [STATUS_CODE.OK]: {
        content: {
          [CONTENT_TYPE.JSON]: {
            schema: {
              type: 'object',
            },
          },
        },
      },
    },
  })
  async getArchives() {
    return this.videoChatProvider.getArchives(null);
  }

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKeys.DeleteArchive]})
  @del('/archives/{archiveId}', {
    description:
      'Used to delete a specific archive w.r.t archiveId. If archive is not present, it will throw HTTP Not Found Error.',
    security: OPERATION_SECURITY_SPEC,
    responses: {
      [STATUS_CODE.OK]: {
        content: {
          [CONTENT_TYPE.TEXT]: {
            schema: {
              type: 'text',
            },
          },
        },
      },
    },
  })
  async deleteArchive(
    @param.path.string('archiveId') archiveId: string,
  ): Promise<void> {
    return await this.chatArchiveSession.deleteArchive(archiveId);
  }

  @authenticate(STRATEGY.BEARER)
  @authorize({permissions: [PermissionKeys.SetUploadTarget]})
  @put('/archives/storage-target', {
    description:
      'Configures custom storage target to a custom Amazon s3 bucket or Microsoft Azure Storage.',
    security: OPERATION_SECURITY_SPEC,
    responses: {
      [STATUS_CODE.OK]: {
        content: {
          [CONTENT_TYPE.TEXT]: {
            schema: {
              type: 'text',
            },
          },
        },
      },
    },
  })
  async setUploadTarget(
    @requestBody() body: S3TargetOptions | AzureTargetOptions,
  ): Promise<void> {
    return await this.chatArchiveSession.setUploadTarget(body);
  }

}
