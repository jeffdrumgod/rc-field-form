import { render, act } from '../test-utils';
import Form, { Field } from '../../src';
import { Input } from '../common/InfoField';
import { changeValue, getField, matchArray } from '../common';
import { vi } from 'vitest';

describe('legacy.basic-form', () => {
  describe('onFieldsChange', () => {
    it('trigger `onFieldsChange` when value change', async () => {
      const onFieldsChange = vi.fn();

      const { container } = render(
        <div>
          <Form onFieldsChange={onFieldsChange}>
            <Field name={['user', 'name']}>
              <Input />
            </Field>
            <Field name={['user', 'age']}>
              <Input type="number" />
            </Field>
            <Field name="agreement">
              <Input type="checkbox" />
            </Field>
          </Form>
        </div>,
      );

      await act(async () => {
        const input = getField(container, ['user', 'name']);
        await changeValue(input, 'Light');
        expect(onFieldsChange.mock.calls[0][0]).toMatchObject([
          { name: ['user', 'name'], value: 'Light' },
        ]);
        matchArray(
          onFieldsChange.mock.calls[0][1],
          [
            { name: ['user', 'name'], value: 'Light' },
            { name: ['user', 'age'], value: undefined },
            { name: ['agreement'], value: undefined },
          ],
          'name',
        );
      });
    });

    // [Legacy] Not trigger in field form. This is anti with origin test
    // https://github.com/react-component/form/blob/master/tests/createForm.spec.js#L70
    it('**Not** trigger `onFieldsChange` when `setFields`', async () => {
      let form;
      const onFieldsChange = vi.fn();

      render(
        <div>
          <Form
            ref={instance => {
              form = instance;
            }}
            onFieldsChange={onFieldsChange}
          >
            <Field name="name">
              <Input />
            </Field>
          </Form>
        </div>,
      );

      await act(async () => {
        form.setFields([{ name: 'name', value: '233' }]);
      });

      expect(onFieldsChange).not.toHaveBeenCalled();
    });
  });

  describe('onValuesChange', () => {
    it('trigger `onValuesChange` when value change', async () => {
      const onValuesChange = vi.fn();

      const { container } = render(
        <Form onValuesChange={onValuesChange}>
          <Field name={['user', 'teste']}>
            <Input />
          </Field>
          <Field name={['user', 'name']}>
            <Input />
          </Field>
          <Field name={['user', 'age']}>
            <Input type="number" />
          </Field>
          <Field name="agreement" valuePropName="checked">
            <Input type="checkbox" />
          </Field>
        </Form>,
      );

      await act(async () => {
        const field = getField(container, ['user', 'name']);
        await changeValue(field, 'Bamboo');
      });

      expect(onValuesChange.mock.calls[0][0]).toMatchObject({ user: { name: 'Bamboo' } });
      expect(onValuesChange.mock.calls[0][1]).toMatchObject({
        user: {
          name: 'Bamboo',
        },
      });
    });

    // [Legacy] Not trigger in field form. This is anti with origin test
    // https://github.com/react-component/form/blob/master/tests/createForm.spec.js#L184
    it('**Not** trigger `onValuesChange` when `setFieldsValue`', async () => {
      let form;
      const onValuesChange = vi.fn();

      render(
        <div>
          <Form
            ref={instance => {
              form = instance;
            }}
            onValuesChange={onValuesChange}
          >
            <Field name={['user', 'name']}>
              <Input />
            </Field>
            <Field name={['user', 'age']}>
              <Input type="number" />
            </Field>
            <Field name="agreement">
              <Input type="checkbox" />
            </Field>
          </Form>
        </div>,
      );

      await act(async () => {
        form.setFieldsValue({ user: { name: 'Light' } });
        expect(onValuesChange).not.toHaveBeenCalled();
      });
    });
  });
});
