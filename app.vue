<script lang="tsx">
import dayjs from 'dayjs';

export default {
  setup() {
    const list = ref([1, 2, 3]);
    const { locale, setLocale } = useI18n();

    const a = ref(dayjs());
    const now = dayjs();
    const isSame = now.isSame("2024-05-22");
    
    const now2 = dayjs().startOf('day');
    const isSame2 = now2.isSame("2024-05-22");

    return {
    list,
    a,
    now,
    now2,
    isSame,
    isSame2,
    locale,

    setLocale
    };
  },
  render() {
    return (
      <>
    <div>
      <button onClick={() => this.setLocale('en')}>EN</button>
      <button onClick={() => this.setLocale('zh')}>ZH</button>
        {this.list.map((item) => {
          return <div>{item}</div>;
        })}
        {/* <p>{this.a}</p> */}
        <p>{`${this.now.format('YYYY-MM-DD ')}`}</p>
        <p>{`${this.isSame}`}</p>
        <p>{`${this.isSame2}`}</p>
        {/* <p>{`${dayjs() === dayjs().isSame("2024-05-22")}`}</p> */}
        {/* <p>{`${dayjs().startOf('day')}`}</p> */}
        <p>{`${this.now2.format('YYYY-MM-DD HH:mm:ss')}`}</p>
        <p>{this.$t('ttes')}</p>
        <p>{this.$t('ttes')}</p>
        <p>{this.$t('hello')}</p>
        <p>{this.locale}</p>
    </div>
    </>
    );
  }
};
</script>
