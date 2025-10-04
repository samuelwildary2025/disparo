import { prisma } from "../config/prisma";
import type { ContactRecord } from "@app-disparo/shared";
import { AppError } from "../utils/app-error";

interface CreateContactListParams {
  userId: string;
  name: string;
  description?: string;
  contacts: ContactRecord[];
  isDraft?: boolean;
}

export class ContactListService {
  async create(params: CreateContactListParams) {
    if (params.contacts.length === 0) {
      throw new AppError("Lista sem contatos válidos", 422);
    }

    const list = await prisma.contactList.create({
      data: {
        userId: params.userId,
        name: params.name,
        description: params.description,
        isDraft: params.isDraft ?? true,
        totalCount: params.contacts.length,
        contacts: {
          create: params.contacts.map((contact) => ({
            name: contact.name,
            phoneNumber: contact.phoneNumber,
            customFields: contact.customFields
          }))
        }
      },
      include: {
        contacts: true
      }
    });

    return list;
  }

  async publish(listId: string, userId: string) {
    return prisma.contactList.update({
      where: { id: listId, userId },
      data: {
        isDraft: false
      }
    });
  }

  async get(userId: string, listId: string) {
    const list = await prisma.contactList.findFirst({
      where: { id: listId, userId },
      include: { contacts: true }
    });
    if (!list) {
      throw new AppError("Lista não encontrada", 404);
    }
    return list;
  }

  async list(userId: string) {
    return prisma.contactList.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" }
    });
  }

  async removeContact(listId: string, contactId: string, userId: string) {
    const contact = await prisma.contact.findFirst({
      where: {
        id: contactId,
        contactListId: listId,
        list: {
          userId
        }
      }
    });

    if (!contact) {
      throw new AppError("Contato não encontrado", 404);
    }

    await prisma.contact.delete({
      where: { id: contactId }
    });

    await prisma.contactList.update({
      where: { id: listId, userId },
      data: {
        totalCount: {
          decrement: 1
        }
      }
    });
  }
}
