# Apollo Dynamic [![npm version](https://badge.fury.io/js/apollo-dynamic.svg)](https://badge.fury.io/js/apollo-dynamic)

Apollo Dynamic allows to create dynamic selection sets on queries, mutations and subscriptions when using [`@apollo/client`](https://github.com/apollographql/apollo-client) for consult GraphQL resolvers. It works by decorating entity classes with `@SelectionType` and `@SelectionField` which allows to fabric dynamics selections set with a similar syntax as TypeORM repositories (relations).

This library can be used with any wrapper of Apollo Client, it offer simple functions and decorators that can be imported directly with TypeScript.

## Installation

```bash
$ npm install apollo-dynamic
```

## Usage

With Apollo Client you can make GraphQL queries like this:

```typescript
import { gql, useQuery } from '@apollo/client';

const GET_PERSONS = gql`
  query GetPersons {
    persons {
      id
      firstname
      lastname
      secret
      profile {
        avatar
        nickname
      }
    }
  }
`;
```

And make the http call using this:

```typescript
const { loading, error, data } = useQuery(GET_PERSONS);
```

It works fine at first, but what happened if we want to not get the profile in some queries, or if we want to hide some parameters by a condition. Well, you probably may answer this:

```typescript
const GET_PERSONS = gql`
  query GetPersons($isSuperAgent: Boolean!, $includeProfile: Boolean!) {
    persons {
      id
      firstname
      lastname
      secret @include(if: $isSuperAgent)
      profile @include(if: $includeProfile) {
        avatar
        nickname
      }
    }
  }
`;
```

And you are right, but what happens if we have relationships that can be nested indefinitely, or if the relationship is in both ways?. In this cases (most cases) you must repeat all the logic for the opposite side of the relationship, in the other entity queries. Some say that this can be afforded with code generation. But i bring here a superior solution: Dynamic Selection Sets!

### Decorators

---

In the typical CRUD systems, we always have entities that we use as interfaces to move data from here to there. So we can assume that if you are using the GetPersons resolver, you probably have a Person entity class or type, like this:

```typescript
export class Person {
    id?: string;
    firstname?: string;
    lastname?: string;
    secret?: string;
    profile: Profile;
    articles: Article[];
}

export class Profile {
    avatar: string;
    nickname: string;
}

export class Article {
    id: string,
    name: string;
    person: Person;
    type: ArticleType;
}

export class ArticleType {
    category: string;
    section: string;
}
```

_We add some more entities for the example._

The proposed library want to make use of this precious interfaces that we don't want to repeat on all the code, because if something change in the entity model we have to change it everywhere. So here we introduce the `@SelectionType` and `@SelectionField` decorators:

```typescript
import { SelectionType, SelectionField } from 'apollo-dynamic'

@SelectionType('Person')
export class Person {
    @SelectionField()
    id?: string;

    @SelectionField()
    firstname?: string;

    @SelectionField()
    lastname?: string;

    @SelectionField({ include: 'isSuperAgent' })
    secret?: string;

    @SelectionField(() => Profile)
    profile: Profile;

    @SelectionField(() => Article)
    articles: Article[];
}

@SelectionType('Profile')
export class Profile {
    @SelectionField()
    avatar: string;

    @SelectionField()
    nickname: string;
}

@SelectionType('Article',{
    default: { relations: { artType: true } }
})
export class Article {
    @SelectionField({ skip: (cond) => cond.noIDsPlease })
    id: string,

    @SelectionField()
    name: string;

    @SelectionField(() => Person)
    person: Person;

    @SelectionField(() => ArticleType)
    artType: ArticleType;
}

@SelectionType('ArticleType')
export class ArticleType {
    @SelectionField()
    category: string;

    @SelectionField()
    section: string;
}
```

Now with this decorators we can use the Selection Types on our queries and the selection set will be generated automatically based on the input parameters we send.

### Queries, Mutations and Subscriptions

---

Going back to our query example, we can rewrite our GraphQL query using the new Selection Types like this (we use the names from `@SelectionType` decorator):

```typescript
const GET_PERSONS = gql`
  query GetPersons {
    persons {
      Person
    }
  }
`;
```

And use it like this:

```typescript
const { loading, error, data } = useQuery(
  select(GET_PERSONS, {
    relations: { profile: false, article: { artType: true } },
    conditions: { isSuperAgent: false }
  })
);
```

This will get us something like this:

```typescript
const GET_PERSONS = gql`
  query GetPersons {
    persons {
      id
      firstname
      lastname
      article {
        id
        name
        artType {
          category
          section
        }
      }
    }
  }
`;
```

We can also create the query from the Article side or from whatever entity we want. The magic is we can define the GraphQL interfaces once and then use em wherever we want without losing the capability of customize the result set. So we don't have to repeat the queries strings for every different selection set we want to ask for. Or moreover, we don't need to mediate with include or skip parameters that can or cannot be relevant (it can't be nullified on common queries).

Going forward, we can do the same with **mutations**:

```typescript
const CREATE_PERSON = gql`
  query CreatePerson($personCreateInput: PersonCreateInput!) {
    createPerson(personCreateInput: $personCreateInput) {
      Person
    }
  }
`;

const [mutateFunction, { data, loading, error }] = useMutation(
  select(CREATE_PERSON, { relations: { profile: true } }),
  { variables: { firstname: 'Jonh', lastname: 'Doe' } }
);
```

And with **subscriptions**:

```typescript
const ARTICLES_SUBSCRIPTION = gql`
  subscription OnArticleAdded($id: ID!) {
    articleAdded(id: $id) {
      Article
    }
  }
`;

const { data, loading } = useSubscription(select(ARTICLES_SUBSCRIPTION, { relations: { artType: true } }), {
  variables: { id: 'someid' }
});
```

## Stay in touch

- Author - [Giuliano Marinelli](https://www.linkedin.com/in/giuliano-marinelli/)
- Website - [https://github.com/giuliano-marinelli](https://github.com/giuliano-marinelli)

## License

This package is [MIT licensed](LICENSE).
