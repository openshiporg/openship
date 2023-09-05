import { gql } from "@keystone-6/core/admin-ui/apollo";

export const staticAdminMetaQuery = gql`
  query StaticAdminMeta {
    keystone {
      __typename
      adminMeta {
        __typename
        lists {
          __typename
          key
          itemQueryName
          listQueryName
          initialSort {
            __typename
            field
            direction
          }
          path
          label
          singular
          plural
          description
          initialColumns
          pageSize
          labelField
          isSingleton
          groups {
            __typename
            label
            description
            fields {
              path
            }
          }
          fields {
            __typename
            path
            label
            description
            fieldMeta
            viewsIndex
            customViewsIndex
            search
            isNonNull
            itemView {
              fieldMode
            }
          }
        }
      }
    }
  }
`;